# ===================================================================
# OUTPUTS
# ===================================================================

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.vouch.dns_name
}

output "load_balancer_url" {
  description = "URL of the application"
  value       = var.enable_https && var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.vouch.dns_name}"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.vouch.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.vouch.name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.vouch.repository_url
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.vouch.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "secrets_manager_arn" {
  description = "ARN of the main Secrets Manager secret"
  value       = aws_secretsmanager_secret.app.arn
  sensitive   = true
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "JWT secret"
  value       = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
  sensitive   = true
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate (if created)"
  value       = var.enable_https && var.domain_name != "" ? aws_acm_certificate.vouch[0].arn : ""
}

output "deployment_commands" {
  description = "Commands for deploying the application"
  value = {
    ecr_login = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    build_image = "docker build -t ${aws_ecr_repository.vouch.name} --target runner ."
    tag_image = "docker tag ${aws_ecr_repository.vouch.name}:latest ${aws_ecr_repository.vouch.repository_url}:latest"
    push_image = "docker push ${aws_ecr_repository.vouch.repository_url}:latest"
    update_service = "aws ecs update-service --cluster ${aws_ecs_cluster.vouch.name} --service ${aws_ecs_service.vouch.name} --force-new-deployment"
  }
}
