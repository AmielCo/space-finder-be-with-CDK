import { DynamoDB } from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const dbClient = new DynamoDB.DocumentClient();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: "Hello from DYnamoDb",
  };

  try {
    if (event.queryStringParameters) {
      if (PRIMARY_KEY! in event.queryStringParameters) {
        result.body = await queryWithPrimaryPartition(event.queryStringParameters)
      } else { 
        result.body = await queryWithSecondaryPartition(event.queryStringParameters)
      }
    }
    else {
      result.body = await scanTable()
    }
  } catch (error) {
    result.body = JSON.stringify(error);
  }
  return result;
}

const queryWithSecondaryPartition = async (queryParams: APIGatewayProxyEventQueryStringParameters) => {
  const queryKey = Object.keys(queryParams)[0];
  const queryValue = queryParams[queryKey];
  const queryResponse = await dbClient.query({
    TableName: TABLE_NAME!,
    IndexName: queryKey,
    KeyConditionExpression: "#primaryKey = :keyValue",
    ExpressionAttributeNames: {
      "#primaryKey": queryKey,
    },
    ExpressionAttributeValues: {
      ":keyValue": queryValue,
    },
  }).promise();
  return JSON.stringify(queryResponse.Items);
}

const queryWithPrimaryPartition = async (queryParams: APIGatewayProxyEventQueryStringParameters) => {
const keyValue = queryParams[PRIMARY_KEY!];
  const queryResponse = await dbClient.query({
    TableName: TABLE_NAME!,
    KeyConditionExpression: "#primaryKey = :keyValue",
    ExpressionAttributeNames: {
      "#primaryKey": PRIMARY_KEY!,
    },
    ExpressionAttributeValues: {
      ":keyValue": keyValue,
    },
  }).promise();
  return JSON.stringify(queryResponse.Items);
}

const scanTable = async () => {
  const queryResponse = await dbClient
          .scan({
            TableName: TABLE_NAME!,
          })
          .promise();
        return JSON.stringify(queryResponse.Items);
      }


export { handler };
