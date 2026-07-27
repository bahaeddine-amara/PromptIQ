from locust import HttpUser, task, between

class PromptIQUser(HttpUser):
    wait_time = between(0.5, 2)

    @task(3)
    def analyze(self):
        self.client.post("/api/v1/prompts/analyze",
                         json={"prompt": "Write a Python function to parse JSON data"})

    @task(1)
    def health(self):
        self.client.get("/health")