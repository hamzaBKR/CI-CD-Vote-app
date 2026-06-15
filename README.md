# Project Overview

This project focuses on building a complete CI/CD and GitOps workflow for a simple feedback voting application.

The application itself is not intended for real production use. The main goal of the project is not to build a complex user interface, but to practice and demonstrate a production-style DevOps workflow using Docker, Kubernetes, Helm, ArgoCD, GitHub Actions, Trivy, Prometheus, and Grafana.

The application is composed of multiple services:

* **Vote App**: a Node.js application where users submit feedback.
* **Redis**: used as a queue between the Vote App and the Worker.
* **Worker**: a .NET service that reads feedback messages from Redis and stores them in PostgreSQL.
* **PostgreSQL**: stores the submitted feedback.
* **Result App**: a Node.js application that reads feedback from PostgreSQL and displays the results.

The project helped me understand how application code, containers, CI/CD pipelines, GitOps, Kubernetes deployments, and monitoring can work together in a real DevOps workflow.

# Architecture

```text
                +------------------+
                |      User        |
                +--------+---------+
                         |
                         v
                +------------------+
                |  NGINX Ingress   |
                |   or NodePort    |
                +--------+---------+
                         |
          +--------------+--------------+
          |                             |
          v                             v
 +----------------+          +----------------+
 |   Vote App     |          |  Result App    |
 |   (Node.js)    |          |   (Node.js)    |
 +--------+-------+          +--------+-------+
          |                           |
          v                           |
 +----------------+                   |
 |     Redis      |                   |
 |    Queue       |                   |
 +--------+-------+                   |
          |                           |
          v                           |
 +----------------+                   |
 |  Worker (.NET) |                   |
 +--------+-------+                   |
          |                           |
          v                           v
 +----------------+          +----------------+
 |   PostgreSQL   |<---------|  Result App    |
 |   Database     |          |  reads data    |
 +----------------+          +----------------+
```

# Technologies Used

* **VMware Workstation**: used to run the Kubernetes virtual machines.
* **Ubuntu**: used as the operating system for the cluster nodes.
* **Kubernetes**: used to deploy and run the application.
* **kubectl**: used to interact with the Kubernetes cluster.
* **kubelet**: Kubernetes node agent responsible for running pods.
* **Docker**: used to build container images.
* **Docker Hub**: used as the container image registry.
* **Git**: used as the version control system.
* **GitHub**: used to host the source code repository.
* **GitHub Actions**: used to automate the CI/CD pipeline.
* **Helm**: used to package and deploy the Kubernetes manifests.
* **ArgoCD**: used for GitOps deployment and synchronization with the GitHub repository.
* **Trivy**: used to scan Docker images for vulnerabilities.
* **Prometheus**: used to collect Kubernetes monitoring metrics.
* **Grafana**: used to visualize cluster metrics and dashboards.
* **VS Code**: used to edit source code, YAML files, and organize the project structure.

# CI/CD Workflow

The CI/CD pipeline is triggered when new code is pushed to the `main` branch.

The workflow performs the following steps:

1. Checks out the source code inside a GitHub Actions runner.
2. Extracts the Docker image tag from the commit message.
3. Validates the application files and Helm chart.
4. Builds Docker images for the Vote App, Result App, and Worker.
5. Pushes the Docker images to Docker Hub.
6. Scans the Docker images using Trivy.
7. Uploads logs and security scan reports as GitHub Actions artifacts.
8. Updates the Helm `values.yaml` file with the new image tags.
9. Commits and pushes the updated Helm values back to GitHub.
10. ArgoCD detects the change in GitHub and synchronizes the Kubernetes cluster.
11. Kubernetes performs a rolling update using the new Docker images.

# GitHub Actions Workflow

```text
Developer Push
      ↓
GitHub Actions
      ↓
Extract Version from Commit Message
      ↓
Validate Application and Helm Chart
      ↓
Build Docker Images
      ↓
Push Images to Docker Hub
      ↓
Trivy Security Scan
      ↓
Update Helm values.yaml
      ↓
Commit and Push Manifest Changes
      ↓
ArgoCD Detects Change
      ↓
Sync Kubernetes Cluster
      ↓
Rolling Update
```

# GitOps Flow

```text
GitHub Repository
        │
        ▼
GitHub Actions
        │
        ├── Validate source code
        ├── Build Docker images
        ├── Push images to Docker Hub
        ├── Scan images with Trivy
        └── Update Helm values.yaml
                 │
                 ▼
          GitHub Repository
                 │
                 ▼
              ArgoCD
                 │
                 ▼
             Kubernetes
                 │
                 ▼
 Vote App + Redis + Worker + PostgreSQL + Result App
                 │
                 ▼
        Prometheus + Grafana
```

# Versioning Strategy

The Docker image tag is defined in the commit message.

Example:

```bash
git commit -m "improve vote app UI :V5"
```

The workflow extracts `V5` from the commit message and uses it as the Docker image tag:

```text
hamzabaker/docker-vote-app:V5
hamzabaker/docker-result-app:V5
hamzabaker/docker-worker:V5
```

After the images are built, pushed, and scanned, GitHub Actions updates the Helm `values.yaml` file with the new tag. ArgoCD then deploys the new version automatically.

# Monitoring

Prometheus and Grafana were added to monitor the Kubernetes cluster.

The monitoring stack provides visibility into:

* Node status
* Pod status
* CPU usage
* Memory usage
* Pod restarts
* Kubernetes workloads
* Cluster health

At this stage, the project includes cluster-level monitoring. Custom application metrics will be added in a future improvement.
