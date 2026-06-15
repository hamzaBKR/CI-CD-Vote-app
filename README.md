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

# GitOps with ArgoCD

ArgoCD is used to manage the deployment of the application using the GitOps approach.

In this project, ArgoCD runs in a dedicated namespace and watches the GitHub repository defined in the ArgoCD `Application` manifest. The `application.yaml` file tells ArgoCD which repository to track, which branch to use, and which Helm chart path should be deployed to the Kubernetes cluster.

The main role of ArgoCD is to make sure that the actual state of the Kubernetes cluster matches the desired state stored in GitHub.

After the GitHub Actions workflow completes successfully, it updates the Helm `values.yaml` file with the new Docker image tags and pushes the change to GitHub. ArgoCD then detects this change and synchronizes the Kubernetes cluster automatically.

This removes the need for manual deployment commands such as `kubectl apply` or `helm upgrade` after every application update.

```text
GitHub Repository
        ↓
GitHub Actions updates Helm values.yaml
        ↓
ArgoCD detects the change
        ↓
ArgoCD syncs the cluster
        ↓
Kubernetes deploys the new application version
```

This ensures that only changes stored in Git are deployed to the cluster, making the deployment process more controlled, repeatable, and traceable.

# Monitoring

Prometheus and Grafana are used for cluster-level monitoring.

Prometheus collects metrics from the Kubernetes cluster, such as CPU usage, memory usage, pod status, node status, restarts, and storage-related information.

Grafana is used to visualize these metrics using dashboards. This makes it easier to understand the health and resource usage of the cluster and the deployed workloads.

At this stage, the monitoring part focuses on Kubernetes infrastructure monitoring, including:

* Node status
* Pod status
* CPU usage
* Memory usage
* Pod restarts
* Kubernetes workloads
* Cluster health
* Persistent volume and storage status

Custom application metrics will be added later as a future improvement after studying Prometheus and Grafana in more depth.

# How to Run Locally

For this project, I used Ubuntu on Windows through WSL as my main working environment.

The Kubernetes cluster was created using virtual machines running on VMware Workstation. After preparing the virtual machines and installing the Kubernetes components, I configured my kubeconfig file on WSL so I could manage the cluster directly from my terminal.

Most of the project was managed from WSL using tools such as:

* `kubectl` to interact with the Kubernetes cluster
* `helm` to deploy the application chart
* `git` to version and push the project files
* `docker` to build and test container images
* VS Code to edit application code, YAML files, Helm templates, and project documentation

VS Code was very useful for editing long YAML files because it provides syntax highlighting, indentation help, and extensions that make working with Helm templates easier.

The deployment process started manually during the learning phase. After that, GitHub Actions and ArgoCD were added to automate the CI/CD and GitOps workflow.

# Screenshots

The following screenshots show the main parts of the project:

![Cluster Resources](images/Cluster_resources.png)

![GitHub Actions Workflow](images/GH_Actions_workflow.png)

![Grafana Dashboard](images/Grafana.png)

![Prometheus Targets](images/Prometheus.png)

![Result App](images/Result_app.png)

![Vote App](images/Vote_APP.png)

# Lessons Learned and Troubleshooting

During this project, I faced and fixed several real DevOps and Kubernetes issues. These problems helped me understand how the different parts of a CI/CD and GitOps workflow work together.

## 1. Docker Image Tag Issue

## 2. Worker CrashLoopBackOff

## 3. PostgreSQL Pending Because of PVC

## 4. PV Released State

## 5. ArgoCD Synced but Degraded

## 6. Local Files Not Updated After GitHub Actions


## 7. Trivy Scan Failure

## 8. GitHub Actions and ArgoCD Integration

## 9. Monitoring Validation

# Future Improvements

The project can be improved further by adding:

* Custom application metrics with `/metrics` endpoints
* ServiceMonitor resources for the application services
* Grafana dashboards for application-level metrics
* Alertmanager alerts
* Slack or email notifications
* Ingress with TLS
* External Secrets or Vault for secret management
* Cloud deployment using AKS or EKS
* Terraform for infrastructure provisioning

```
```

