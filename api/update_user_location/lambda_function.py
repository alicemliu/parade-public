import json
import boto3
import string
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from exponent_server_sdk import DeviceNotRegisteredError
from exponent_server_sdk import PushClient
from exponent_server_sdk import PushMessage
from exponent_server_sdk import PushResponseError
from exponent_server_sdk import PushServerError
from requests.exceptions import ConnectionError
from requests.exceptions import HTTPError
import requests

dynamodb = boto3.resource('dynamodb', region_name='us-east-2', endpoint_url="https://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('parata-users')

def updateLocation(body):
        
    messsage = ''
    try:
        response = table.get_item(
            Key={
                'group_code': body['group_code'],
                'device_id': body['device_id']
            },
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        item = response['Item']
        print("GetItem succeeded:")
        if item['is_home'] == body['is_home']:
            return {
                'statusCode': 200,
                'body': json.dumps({"message": "no change to location status"})
            }
        else:
            if body['is_home'] == "true":
                message = item['name'] + " arrived home!"
            else:
                message = item['name'] + " left home!"
            print(message)
    
    try:
        response = table.update_item(
            Key = {
                'group_code': body['group_code'],
                'device_id': body['device_id']
            },
            UpdateExpression="set is_home = :r",
            ExpressionAttributeValues={
                ':r': body['is_home'],
            },
        )
    except ClientError as e:
        return {
            'statusCode': 400,
            body: json.dumps(e.response['Error']['Message'])
        }
    
    push_tokens = []
    print("")
    try:
        response = table.query(
            KeyConditionExpression=Key('group_code').eq(body['group_code'])
        )
        for entry in response['Items']:
            if entry['device_id'] != body['device_id']:
                print("adding token")
                push_tokens.append(entry['push_token'])
        print(push_tokens)
        send_message(push_tokens, message)
        # for token in push_tokens:
        #     send_push_message(token, messsage)
            
    except ClientError as e:
        print(e.response['Error']['Message'])
        
    return {
        'statusCode': 200,
        'body': json.dumps({"push_tokens": push_tokens})
    }
    
def send_message(push_tokens, message):
    url = 'https://exp.host/--/api/v2/push/send'
    body = []
    for token in push_tokens:
        body.append({
            "to": token,
            "title":"Parata",
            "body": message
        })
    headers = {
        'host': 'exp.host',
        'accept': 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json'
    }
    r = requests.post(url, data=json.dumps(body), headers=headers)
    print("message sent")
    print(r.content)
    
def send_push_message(token, message, extra=None):
    try:
        response = PushClient().publish(
            PushMessage(to=token,
                        body=message,
                        data=extra))
        print("successful for :" + token)
    except PushServerError as exc:
        # Encountered some likely formatting/validation error.
        rollbar.report_exc_info(
            extra_data={
                'token': token,
                'message': message,
                'extra': extra,
                'errors': exc.errors,
                'response_data': exc.response_data,
            })
        raise
    except (ConnectionError, HTTPError) as exc:
        # Encountered some Connection or HTTP error - retry a few times in
        # case it is transient.
        rollbar.report_exc_info(
            extra_data={'token': token, 'message': message, 'extra': extra})
        raise self.retry(exc=exc)

    try:
        # We got a response back, but we don't know whether it's an error yet.
        # This call raises errors so we can handle them with normal exception
        # flows.
        response.validate_response()
    except DeviceNotRegisteredError:
        # Mark the push token as inactive
        from notifications.models import PushToken
        PushToken.objects.filter(token=token).update(active=False)
    except PushResponseError as exc:
        # Encountered some other per-notification error.
        rollbar.report_exc_info(
            extra_data={
                'token': token,
                'message': message,
                'extra': extra,
                'push_response': exc.push_response._asdict(),
            })
        raise self.retry(exc=exc)

def lambda_handler(event, context):
    body = json.loads(event['body'])
    return updateLocation(body)
    
