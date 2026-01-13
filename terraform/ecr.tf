# ===================================================================
# AMAZON ECR - Elastic Container Registry
# ===================================================================

# ECR repository for Docker images
resource "aws_ecr_repository" "vouch" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-ecr-repo"
  })
}

# ECR repository lifecycle policy
resource "aws_ecr_lifecycle_policy" "vouch" {
  repository = aws_ecr_repository.vouch.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
