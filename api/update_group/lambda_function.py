import json
import boto3
from boto3.dynamodb.conditions import Key
import random
import string

dynamodb = boto3.resource('dynamodb', region_name='us-east-2', endpoint_url="https://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('parata-users')

def createGroup(body):
    new_code = ''
    while True:
        new_code = randomString()
        print(new_code)
        response = table.query(
            KeyConditionExpression=Key('group_code').eq(new_code)
        )
        if len(response['Items']) == 0:
            break
    response = table.put_item(
        Item = {
            'group_code': new_code,
            'device_id': body['device_id'],
            'name': body['name']
        }
    )
    return new_code
    
def joinGroup(body):
    response = table.query(
        KeyConditionExpression=Key('group_code').eq(body['group_code'])
    )
    if len(response['Items']) == 0:
        return {
            'statusCode': 400,
            'body': json.dumps('invalid group code')
        }
    try:
        response = table.put_item(
            Item = {
                'group_code': body['group_code'],
                'device_id': body['device_id'],
                'name': body['name']
            }
        )
        
    except ClientError as e:
        return {
            'statusCode': 400,
            body: json.dumps(e.response['Error']['Message'])
        }

def leaveGroup(body):
    response = table.delete_item(
        Key = {
            'group_code': body['group_code'],
            'device_id': body['device_id'],
        }
    )
    
def randomString(stringLength=5):
    letters = string.ascii_uppercase
    return ''.join(random.choice(letters) for i in range(stringLength))

def lambda_handler(event, context):
    body = json.loads(event['body'])
    if event['resource'] == '/create':
        new_code = createGroup(body)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'group_code': new_code
            })
        }
    elif event['resource'] == '/join':
        joinGroup(body)
        return {
            'statusCode': 200,
            'body': json.dumps('successfully joined group')
        }
    elif event['resource'] == '/leave':
        leaveGroup(body)
        return {
            'statusCode': 200,
            'body': json.dumps('successfully left group')
        }
    return {
        'statusCode': 400,
        'body': json.dumps('invalid resource path')
    }

