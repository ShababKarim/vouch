# ===================================================================
# NETWORKING
# ===================================================================

# Create private subnets for RDS if not provided
resource "aws_subnet" "private_a" {
  count             = length(var.private_subnet_ids) == 0 ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = cidrsubnet(data.aws_vpc.default.cidr_block, 8, 1)
  availability_zone = "${data.aws_region.current.name}a"
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-a"
    Type = "private"
  })
}

resource "aws_subnet" "private_b" {
  count             = length(var.private_subnet_ids) == 0 ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = cidrsubnet(data.aws_vpc.default.cidr_block, 8, 2)
  availability_zone = "${data.aws_region.current.name}b"
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-b"
    Type = "private"
  })
}

# Route table for private subnets
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_ids) == 0 ? 1 : 0
  vpc_id = local.vpc_id
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-rt"
  })
}

resource "aws_route_table_association" "private_a" {
  count          = length(var.private_subnet_ids) == 0 ? 1 : 0
  subnet_id      = aws_subnet.private_a[0].id
  route_table_id = aws_route_table.private[0].id
}

resource "aws_route_table_association" "private_b" {
  count          = length(var.private_subnet_ids) == 0 ? 1 : 0
  subnet_id      = aws_subnet.private_b[0].id
  route_table_id = aws_route_table.private[0].id
}

# ===================================================================
# SECURITY GROUPS
# ===================================================================

# Security group for ECS tasks
resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = local.vpc_id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-ecs-sg"
  })
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = local.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-rds-sg"
  })
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = local.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-sg"
  })
}

# ===================================================================
# IAM ROLES
# ===================================================================

# ECS task execution role
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-ecs-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS task role with Secrets Manager access
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "ecs_task_policy" {
  name        = "${var.app_name}-ecs-task-policy"
  description = "Policy for ECS tasks to access Secrets Manager and S3"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [aws_secretsmanager_secret.app.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.uploads.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}
