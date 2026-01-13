# ===================================================================
# AMAZON ECS - Elastic Container Service
# ===================================================================

# ECS Cluster
resource "aws_ecs_cluster" "vouch" {
  name = "${var.app_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-cluster"
  })
}

# CloudWatch log group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = var.environment == "production" ? 30 : 7
  
  tags = local.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "vouch" {
  family                   = "${var.app_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name  = local.container_name
      image = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${aws_ecr_repository.vouch.name}:latest"
      
      portMappings = [
        {
          containerPort = local.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:JWT_SECRET::"
        },
        {
          name      = "TWILIO_ACCOUNT_SID"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:TWILIO_ACCOUNT_SID::"
        },
        {
          name      = "TWILIO_AUTH_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:TWILIO_AUTH_TOKEN::"
        },
        {
          name      = "TWILIO_VERIFY_SERVICE_SID"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:TWILIO_VERIFY_SERVICE_SID::"
        },
        {
          name      = "TWILIO_PHONE_NUMBER"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:TWILIO_PHONE_NUMBER::"
        },
        {
          name      = "AWS_REGION"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:AWS_REGION::"
        },
        {
          name      = "S3_BUCKET_NAME"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:S3_BUCKET_NAME::"
        },
        {
          name      = "NEXT_PUBLIC_APP_URL"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:NEXT_PUBLIC_APP_URL::"
        },
        {
          name      = "JWT_EXPIRY_HOURS"
          valueFrom = "${aws_secretsmanager_secret.app.arn}:JWT_EXPIRY_HOURS::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${local.container_port}${local.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
      
      dockerLabels = {
        "com.amazonaws.ecs.task-arn" = "${aws_ecs_task_definition.vouch.arn}"
      }
    }
  ])
  
  tags = local.common_tags
}

# ECS Service
resource "aws_ecs_service" "vouch" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.vouch.id
  task_definition = aws_ecs_task_definition.vouch.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = local.public_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.vouch.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }
  
  deployment_controller {
    type = "ECS"
  }
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 50
  }
  
  # Enable deployment circuit breaker
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  # Service discovery (optional, for internal communication)
  # enable_execute_command = true  # Uncomment for debugging
  
  depends_on = [aws_lb_listener.vouch]
  
  tags = local.common_tags
}
