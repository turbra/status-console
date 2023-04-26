# Super simple status console

# Features
Green is good

Red with an rgb Tux is bad

15s refresh interval

# Podman Local Testing
Add your endpoints to the `config.json`
``` json
{
  "endpoints": [
    {
      "displayName": "Application 1",
      "url": "https://example.endpoint.com/healthz",
      "statusField": "status"
    },
    {
      "displayName": "Application 2",
      "url": "https://example.endpoint.com/healthz",
      "statusField": "status"
    }
  ]
}
```

```
npm init -y
npm install express axios ejs
```
```
podman build -t status-console .
podman run -d --name status-console -p 9000:3000 localhost/status-console
```

# OpenShift Deployment spec
Modify the image tag in `deployment.yaml`
``` yaml
...
spec:
      containers:
      - name: statuspage
        image: repo/status-page:<TAG>
        ports:
        - containerPort: 3000
```

Modify the `route.yaml`
``` yaml
...
spec:
  host: statuspage.apps.example.com
```

### All Systems are healthy
![image](https://user-images.githubusercontent.com/52045281/234613465-5b7f307f-ac06-45a1-a01b-521b77d55895.png)




### Partial or Complete Outage
![image](https://user-images.githubusercontent.com/52045281/234613528-4c918a04-e468-4859-8188-cda2fe11b1c1.png)

