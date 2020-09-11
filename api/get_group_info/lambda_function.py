import json
import boto3
from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource('dynamodb', region_name='us-east-2', endpoint_url="https://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('parata-users')

def getGroupInfo(group_code):
    response = table.query(
        KeyConditionExpression=Key('group_code').eq(group_code)
    )
    # if len(response['Items']) == 0:
    #     return {
    #         'statusCode': 400,
    #         'body': json.dumps('invalid group code')
    #     }
    print(response)
    return {
        'statusCode': 200,
        'body': json.dumps({
            'group_code': group_code,
            'group_members': response['Items']
        })
    }

def lambda_handler(event, context):
    group_code = event['queryStringParameters']['group_code']
    return getGroupInfo(group_code)

