# ===================================================================
# APPLICATION LOAD BALANCER
# ===================================================================

# Application Load Balancer
resource "aws_lb" "vouch" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.public_subnet_ids
  
  enable_deletion_protection = var.environment == "production" ? true : false
  
  # Access logs
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb"
  })
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.app_name}-alb-logs-${local.unique_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-logs"
  })
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  rule {
    id     = "delete_old_logs"
    status = "Enabled"
    
    expiration {
      days = 90
    }
  }
}

# ALB log bucket policy
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSLogDeliveryAclCheck"
        Effect    = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.alb_logs.arn
      },
      {
        Sid       = "AWSLogDeliveryWrite"
        Effect    = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action    = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource  = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Target group for ECS service
resource "aws_lb_target_group" "vouch" {
  name     = "${var.app_name}-tg"
  port     = local.container_port
  protocol = "HTTP"
  vpc_id   = local.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = {
      status_code = "200"
    }
    path                = local.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
  
  deregistration_delay = 30
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-tg"
  })
}

# HTTP listener
resource "aws_lb_listener" "vouch_http" {
  load_balancer_arn = aws_lb.vouch.arn
  port              = "80"
  protocol          = "HTTP"
  
  # Redirect to HTTPS if SSL is enabled
  default_action {
    type = var.enable_https ? "redirect" : "forward"
    
    dynamic "redirect" {
      for_each = var.enable_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    
    dynamic "forward" {
      for_each = var.enable_https ? [] : [1]
      content {
        target_group {
          arn = aws_lb_target_group.vouch.arn
        }
      }
    }
  }
}

# HTTPS listener (if enabled)
resource "aws_lb_listener" "vouch" {
  count             = var.enable_https ? 1 : 0
  load_balancer_arn = aws_lb.vouch.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.enable_https && var.domain_name != "" ? aws_acm_certificate.vouch[0].arn : ""
  
  default_action {
    type = "forward"
    
    forward {
      target_group {
        arn = aws_lb_target_group.vouch.arn
      }
    }
  }
}
