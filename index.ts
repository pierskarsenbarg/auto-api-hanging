import { LocalWorkspace } from '@pulumi/pulumi/automation';
import * as aws from '@pulumi/aws';
import * as pulumi from "@pulumi/pulumi";
import * as apigateway from '@pulumi/aws-apigateway';

const projectName = 'apigw-test';
(async () => {
  const pulumiProgram = async () => {
    const role = new aws.iam.Role(`${projectName}-iam-role`, {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.LambdaPrincipal),
      managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
    });
  
    const code = new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive("./app")
    });
  
    // Create a Lambda function
    const lambdaFunction = new aws.lambda.Function(`${projectName}-lambda`, {
      code,
      role: role.arn,
      handler: 'getCustomerHandler.handler',
      runtime: 'nodejs18.x',
    });
  
    // Create a API Gateway Rest API
    const restAPI = new apigateway.RestAPI(`${projectName}-api-gateway`, {
      routes: [
        {
          method: 'GET',
          path: '/getCustomer',
          eventHandler: lambdaFunction,
        },
      ],
      // stageName: 'dev',
    });
  };

  const stack = await LocalWorkspace.createOrSelectStack({ program: pulumiProgram, projectName, stackName: 'test' });
  await stack.setConfig('aws:region', { value: 'eu-west-2' });
  await stack.up({ onOutput: console.log, logVerbosity: 10, logToStdErr: true });
  // await stack.destroy({ onOutput: console.log });
})();
