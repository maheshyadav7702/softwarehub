## Final Production Architecture

```
GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Build Docker Image
   │
   ▼
Amazon ECR
   │
   ▼
Update ECS Task Definition
   │
   ▼
Update ECS Service
   │
   ▼
ECS Cluster
   │
   ▼
Task
   │
   ▼
Target Group
   │
   ▼
Application Load Balancer
   │
   ▼
Internet
```
## Step 1 Create Security Groups

`You should have three security groups.`

# ALB SG - Inbound

```
| Type  | Port | Source    |
| ----- | ---- | --------- |
| HTTP  | 80   | 0.0.0.0/0 |
| HTTPS | 443  | 0.0.0.0/0 |
```
 - Outbound - All Traffic

 # ECS SG - Inbound

 - 3000 Source = ALB Security Group

 - NOT : 0.0.0.0/0 | Outbound  - All Traffic

 # RDS SG
 - Inbound : 3306 Source = ECS SG 
 # Step 2 Create Target Group
 
 `Ec2 -> Target Groups -> Choose(Target Type = IP) (NOT Instance - because ECS Fargate uses IP targets.) -> Protocol : HTTP -> Port (3000 - exposed port) -> Health check (/ | /health) -> if your application exposes a health endpoint. Health Check Settings like below:`
 ```
 Healthy threshold = 2

Unhealthy threshold = 2

Interval = 30 sec

Timeout = 5 sec

Success Code = 200
 ```
 `-> Name (hub-app-tg) -> Don't register targets manually. ECS will register them.`

 # Step 3 Create ALB

 `EC2 -> Load Balancer -> Application Load Balancer -> Name -> Choose : Internet Facing -> IP4 -> Subnets (public 2A, Public 2B) -> Security Group (ALB SG) -> Listener (Http - 80) -> Forward (hub-app-tg0) -> Later add HTTPS (443) with ACM.`

 # Step 4 Create ECS Cluster

 ```
 Amazon ECS
↓
Clusters
↓
Create Cluster
```
`Cluster Name (hub-production) -> Infrastructure(AWS Fargate) -> Enable Container Insights (recommended).`

# Step 5 Task Definition
`Create (hub-task) -> Launch Type(Fargate) -> CPU(0.5), Memory(1GB) -> Execution Role(ecsTaskExecutionRole : AmazonECSTaskExecutionRolePolicy & CloudWatchLogsFullAccess & SecretsManagerReadWrite) -> Container (hub-container) -> Image(<ACCOUNT>.dkr.ecr.ap-south-2.amazonaws.com/hub-app:latest) -> Port(3000) -> Essential (Yes) -> Log Driver (awslogs) -> CloudWatch Group (/ecs/hub-production)`

# Environment Variables
- If the values are public build-time values (such as NEXT_PUBLIC_*), they're already baked into the image during docker build, so you don't need to define them again in the task.

- If you have runtime secrets (API keys, DB passwords, JWT secrets, etc.), configure them under Secrets in the task definition and reference AWS Secrets Manager or Systems Manager Parameter Store.

# Step 6 Create ECS Service : Cluster
`hub-production -> Task(hub-task) -> Service Name (hub-service) -> Desired Tasks(2) -> Deployment(Rolling Update) -> Networking(Private Subnets : Private Subnet A & Private Subnet B) -> Security Group (ECS SG) -> Public IP(Disabled) -> Load Balancer (Application Load Balancer -> hub-app-alb) -> Listener (existing listemer - 80) -> Target Group (hub-app-tg : The service will automatically register task IPs with the target group.) `
 
# Step 7 Verify
- When the service starts, you should see: 
```
Target Group
↓
Healthy
2/2
```
## If it stays unhealthy:
- Check the application is listening on port 3000.
- Confirm the health check path returns HTTP 200.
- Verify the ECS security group allows port 3000 from the ALB security group.
- Check CloudWatch logs for startup errors.

## Step 8 Auto Scaling

- Open the ECS Service.: 
```
Auto Scaling
↓
Configure
```
- Recommended settings:
```
Minimum Tasks
2
Desired
2
Maximum
6
```
- Policy : Target Tracking
- Metric : ECSServiceAverageCPUUtilization
- Target : 60%
- Add another policy: Memory - 70%
- Note: This allows ECS to scale out when CPU or memory usage increases and scale back in when demand drops.

# Step 9 ACM HTTPS:
- Request a certificate for: 
`maheshit.in`
- Validate through Route 53.
- Add an HTTPS (443) listener to the ALB using the ACM certificate, and configure an HTTP (80) listener rule to redirect traffic to HTTPS.

```
                     Internet
                         │
                         ▼
              Route53 (Domain)
                         │
                         ▼
                    ALB (Public)
                         │
                         ▼
                Target Group (3000)
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
      ECS Task 1                   ECS Task 2
           │                            │
           └──────────────┬─────────────┘
                          ▼
                     ECS Service
                          │
                          ▼
                     ECS Cluster
                          │
                          ▼
                   Image from ECR
```
# For ECS, GitHub Actions should:
```
GitHub
     │
     ▼
Build Image
     │
     ▼
Push to ECR
     │
     ▼
Register New Task Definition
     │
     ▼
Update ECS Service
     │
     ▼
ECS pulls new image
     │
     ▼
Old Task Stops
     │
     ▼
New Task Starts
```
`task-definition.json file 
```
{
  "family": "hub-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hub-container",
      "image": "IMAGE_PLACEHOLDER",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hub-production",
          "awslogs-region": "ap-south-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```
# How this works

- Step 1
```
- name: Download task definition
  run: |
    aws ecs describe-task-definition \
      --task-definition vhl-qa-mimicry-app-task \
      --query taskDefinition \
      > task-definition.json
```
- Step 2:
```
- name: Fill in the new image ID
  id: task-def
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: task-definition.json
    container-name: vhl-qa-mimicry-app
    image: ${{ steps.build-image.outputs.image }}
```

- Step 3:
```
- name: Deploy Amazon ECS task definition
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: ${{ steps.task-def.outputs.task-definition }}
    service: vhl-qa-mimicry-app-service
    cluster: vhl-qa-mimicry
    wait-for-service-stability: true
```
## Note: This step performs several actions automatically:
- Registers a new task definition revision.
- Updates the ECS service to use the new revision.
- Starts new tasks.
- Waits for the new tasks to become healthy.
- Stops the old tasks.

# Deployment flow
```
Git Push
    │
    ▼
Build Docker Image
    │
    ▼
Push Image to ECR
    │
    ▼
Download Current Task Definition
    │
    ▼
Replace Image
    │
    ▼
Register New Revision
    │
    ▼
Update ECS Service
    │
    ▼
Start New Tasks
    │
    ▼
Health Check
    │
    ▼
Stop Old Tasks
```
# For your production project:
- Your current workflow would become something like this after the image is pushed:
```
- name: Download task definition
  run: |
    aws ecs describe-task-definition \
      --task-definition hub-task \
      --query taskDefinition \
      > task-definition.json

- name: Render task definition
  id: task-def
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: task-definition.json
    container-name: hub-container
    image: ${{ steps.build-image.outputs.image }}

- name: Deploy ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v2
  with:
    task-definition: ${{ steps.task-def.outputs.task-definition }}
    service: hub-service
    cluster: hub-production
    wait-for-service-stability: true
```
# One important thing to verify

- When using amazon-ecs-render-task-definition, the container-name must exactly match the container name defined in your ECS task definition—not the task definition family name or the service name.

- For example:

- Task Definition family: hub-task
- Container name: hub-container
- Service name: hub-service

```
{
  "containerDefinitions": [
    {
      "name": "hub-container"
    }
  ]
}
```
# I recommend one small improvement
` uses: aws-actions/amazon-ecs-deploy-task-definition@v1` to `uses: aws-actions/amazon-ecs-deploy-task-definition@v2`
- v2 includes bug fixes and improvements over v1.

## YML file
```
name: App Deployment

on:
  push:
    branches:
      - main

env:
  AWS_REGION: ap-south-2
  IMAGE_TAG: ${{ github.sha }}

permissions:
  contents: read
  packages: write

jobs:
  deploy:
    name: Deploy
    runs-on: ["self-hosted", "mahesh_it_app"]

    steps:
      - name: Checkout source code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get secrets from AWS Secrets Manager
        id: get_secrets
        run: |
          SECRET_JSON=$(aws secretsmanager get-secret-value \
            --secret-id aws_ecr_repo \
            --region ap-south-2 \
            --query SecretString \
            --output text)

          # Mask the entire secret
          echo "::add-mask::$SECRET_JSON"

          echo "$SECRET_JSON" > secret.json

          # Extract values
          APP_ECR_REGISTRY=$(jq -r '.AWS_ECR_REPO' secret.json)
          NEXT_PUBLIC_API_URL=$(jq -r '.NEXT_PUBLIC_API_URL' secret.json)
          NEXT_PUBLIC_APP_NAME=$(jq -r '.NEXT_PUBLIC_APP_NAME' secret.json)

          # Mask individual values
          echo "::add-mask::$APP_ECR_REGISTRY"
          echo "::add-mask::$NEXT_PUBLIC_API_URL"
          echo "::add-mask::$NEXT_PUBLIC_APP_NAME"

          # Export as GitHub Environment Variables
          echo "APP_ECR_REGISTRY=$APP_ECR_REGISTRY" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME" >> $GITHUB_ENV

      - name: Build, Tag and Push Docker Image
        id: build-image
        run: |
          docker build \
            -t $APP_ECR_REGISTRY:hub-app-$IMAGE_TAG \
            --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
            --build-arg NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
            -f Dockerfile . \
            --no-cache

          aws ecr get-login-password --region $AWS_REGION | \
            docker login --username AWS --password-stdin $APP_ECR_REGISTRY

          docker push $APP_ECR_REGISTRY:hub-app-$IMAGE_TAG

          echo "image=$APP_ECR_REGISTRY:hub-app-$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Download Current ECS Task Definition
        run: |
          aws ecs describe-task-definition \
            --task-definition app-task-def \
            --query taskDefinition \
            > task-definition.json

      - name: Update Task Definition with New Image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: hub-app-container
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          cluster: prod-cluster
          service: app-service
          wait-for-service-stability: true
```
# Check CloudWatch Logs:
```
CloudWatch
    ↓
Log Groups
    ↓
/ecs/your-log-group
```
# ECS deployment takes:
```
| Stage                        | Expected Time        |
| ---------------------------- | -------------------- |
| Build Docker image           | 1–3 minutes          |
| Push image to ECR            | 30 seconds–2 minutes |
| Register new task definition | 5–10 seconds         |
| Start new ECS tasks          | 30–90 seconds        |
| ALB health checks            | 30–90 seconds        |
| Stop old tasks               | 10–30 seconds        |
| **Total**                    | **3–8 minutes**      |
```
# Create ECS Resources for API:
```
| Resource           | Suggested Name                                      |
| ------------------ | --------------------------------------------------- |
| ECS Cluster        | `prod-api-cluster` (or reuse your existing cluster) |
| Task Definition    | `api-task-def`                                      |
| Service            | `api-service`                                       |
| Container          | `hub-api-container`                                 |
| Target Group       | `api-target-group`                                  |
| ALB                | Reuse existing ALB or create a new one              |
| ECS Security Group | `api-ecs-sg`                                        |
```
- Note: same steps follow
- Port: 8000
# Environment Variables
- Need to be set the environment variable while creating the service.
# ECS Service:
- Configure::

```
| Setting        | Value                                         |
| -------------- | --------------------------------------------- |
| Cluster        | `prod-api-cluster` (or your existing cluster) |
| Task           | `api-task-def`                                |
| Service        | `api-service`                                 |
| Desired Tasks  | 2                                             |
| Launch Type    | Fargate                                       |
| Subnets        | Private                                       |
| Public IP      | Disabled                                      |
| Security Group | `api-ecs-sg`                                  |
| Load Balancer  | Existing ALB                                  |
| Target Group   | `api-target-group`                            |
```
# Add ECS Deployment Steps:
```
      - name: Download Current ECS Task Definition
        run: |
          aws ecs describe-task-definition \
            --task-definition api-task-def \
            --query taskDefinition \
            > task-definition.json

      - name: Update Task Definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: hub-api-container
          image: ${{ env.AWS_API_ECR_REPO }}:hub-api-${{ env.IMAGE_TAG }}

      - name: Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: api-service
          cluster: prod-api-cluster
          wait-for-service-stability: true
```

# Env variables:
```
APP_NAME
APP_VERSION
DEBUG
HOST
PORT
MYSQL_HOST
MYSQL_PORT
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
JWT_SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS
```
```
| Key                         | Value                                        |
| --------------------------- | -------------------------------------------- |
| APP_NAME                    | `<secret-arn>:APP_NAME::`                    |
| APP_VERSION                 | `<secret-arn>:APP_VERSION::`                 |
| DEBUG                       | `<secret-arn>:DEBUG::`                       |
| HOST                        | `<secret-arn>:HOST::`                        |
| PORT                        | `<secret-arn>:PORT::`                        |
| MYSQL_HOST                  | `<secret-arn>:MYSQL_HOST::`                  |
| MYSQL_PORT                  | `<secret-arn>:MYSQL_PORT::`                  |
| MYSQL_DATABASE              | `<secret-arn>:MYSQL_DATABASE::`              |
| MYSQL_USER                  | `<secret-arn>:MYSQL_USER::`                  |
| MYSQL_PASSWORD              | `<secret-arn>:MYSQL_PASSWORD::`              |
| JWT_SECRET_KEY              | `<secret-arn>:JWT_SECRET_KEY::`              |
| JWT_ALGORITHM               | `<secret-arn>:JWT_ALGORITHM::`               |
| ACCESS_TOKEN_EXPIRE_MINUTES | `<secret-arn>:ACCESS_TOKEN_EXPIRE_MINUTES::` |
| REFRESH_TOKEN_EXPIRE_DAYS   | `<secret-arn>:REFRESH_TOKEN_EXPIRE_DAYS::`   |

```
# What is CloudFront?
- CloudFront is AWS's Content Delivery Network (CDN).
# Without CloudFront
```
User
   │
   ▼
Route53
   │
   ▼
ALB
   │
   ▼
ECS
```
# With CloudFront:
```
User
   │
   ▼
CloudFront
   │
   ▼
ALB
   │
   ▼
ECS
```
# Step 1: Open CloudFront:
```
AWS Console
    ↓
CloudFront
    ↓
Create Distribution
```
# Step 2: Origin:
`Select your ALB. -> internal-prod-alb-xxxxxxxx.ap-south-2.elb.amazonaws.com`
# Step 3: Origin Protocol
- HTTPS Only
# Step 4: Viewer Protocol Policy
- Redirect HTTP to HTTPS
# Step 5: Allowed HTTP Methods
```
GET
HEAD
OPTIONS
```
# Step 6: Cache Policy
- CachingOptimized
# Step 7: Origin Request Policy
- AllViewerExceptHostHeader
- or
- Managed-AllViewer
# Step 8: Alternate Domain Name (CNAME)
- dev.maheshit.in
# Step 9: SSL Certificate
- Choose `maheshit.in`
- Important: CloudFront only accepts ACM certificates that are in the us-east-1 (N. Virginia) region.

If your current certificate is in ap-south-2, you'll need to request or import the same certificate in us-east-1 and select that one for CloudFront.
# Step 10: Create Distribution
- click: Create Distribution
# Step 11: Route53
`Edit -> dev.maheshit.in`
```
Current

Route53
      │
      ▼
ALB
```

```
Change to:
Route53
      │
      ▼
CloudFront
```
- Create an Alias A record pointing to the CloudFront distribution.
# Final Architecture
```
                 User
                   │
                   ▼
              Route53
                   │
                   ▼
             CloudFront
                   │
                   ▼
                 ALB
             ┌──────────┐
             │          │
             ▼          ▼
         Next.js      FastAPI
             │
             ▼
         Amazon RDS
```
`Origin Path (Leave empty.) -> Enable Origin Shield(Choose-> NO) -> (You can enable it later if needed.) -> Click Next`
# Step 4 - TLS Certificate
- Since your domain is already:
`dev.maheshit.in`
- AWS will ask for a certificate.
- Important
``` If your current ACM certificate is in ap-south-2, it cannot be attached to CloudFront.

If you don't already have one in us-east-1, you'll need to:

Switch the AWS Console region to US East (N. Virginia).
Open AWS Certificate Manager (ACM).

Request a public certificate for:

dev.maheshit.in

(or *.maheshit.in if you use a wildcard certificate).

Validate it (Route 53 DNS validation makes this very easy).
Return to CloudFront and select that certificate.
```
# Step 5 - Review & Create
- Review the settings and click:
- Create Distribution
# Step 6 - Update Route 53
`After the distribution status becomes Deployed: -> Go to: -> Route53 → Hosted Zone → maheshit.in -> Edit -> dev.maheshit.in -> Change it from: ALB to -> CloudFront Distribution (using an Alias A Record.)`
- Your traffic will then flow like this:
```
Browser
      │
      ▼
CloudFront
      │
      ▼
Frontend ALB
      │
      ▼
Next.js ECS
```
# The flow becomes:
```
User
    │
    ▼
Route53
    │
    ▼
CloudFront
    │
    ▼
Frontend ALB
    │
    ▼
Next.js ECS
```
# Review
```
| Setting           | Status                        |
| ----------------- | ----------------------------- |
| Distribution Name | ✅ `maheshit-dev-distribution` |
| Domain            | ✅ `dev.maheshit.in`           |
| Origin            | ✅ Frontend ALB                |
| Origin Protocol   | ✅ HTTPS                       |
| Cache             | ✅ AWS Recommended             |
| WAF               | ✅ Not enabled (fine for now)  |
| ACM Certificate   | ✅ `*.maheshit.in` (us-east-1) |
```
# Current status:
```
| Resource                | Status                                             |
| ----------------------- | -------------------------------------------------- |
| CloudFront Distribution | ✅ Enabled                                          |
| Distribution Domain     | `d37l5psm24gsh4.cloudfront.net`                    |
| Custom Domain           | `dev.maheshit.in`                                  |
| Origin                  | ✅ `app-alb-824738556.ap-south-2.elb.amazonaws.com` |
| ACM Certificate         | ✅ `*.maheshit.in`                                  |
| Distribution            | Standard                                           |
```
# Your Final Architecture
```
                    Internet
                        │
                        ▼
                  Route53 DNS
                        │
        ┌───────────────┴────────────────┐
        ▼                                ▼
dev.maheshit.in                  dev-api.maheshit.in
        │                                │
        ▼                                ▼
 CloudFront                        API ALB
        │                                │
        ▼                                ▼
 Frontend ALB                     FastAPI ECS
        │                                │
        ▼                                ▼
    Next.js ECS                    Amazon RDS
```

