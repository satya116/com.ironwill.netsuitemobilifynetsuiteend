Yes. Since you want to do the flow **manually**—Step 1 in the browser, Step 2 in Postman, then use the access token in Step 3—here is the complete NetSuite OAuth 2.0 Authorization Code Grant flow.

One terminology point first: NetSuite officially describes the authorization-code grant itself as **two steps**: GET authorization → POST token exchange. I’ll call the actual API request with the resulting access token **Step 3**, because operationally that is what you do next. ([Oracle Docs][1])

## 0. NetSuite setup first

Before making requests, create/configure your NetSuite Integration Record and enable OAuth 2.0.

You need these values:

```text
Account ID
Client ID
Client Secret
Redirect URI
```

For example:

```text
Account ID:
TSTDRV1395241

Client ID:
YOUR_CLIENT_ID

Client Secret:
YOUR_CLIENT_SECRET

Redirect URI:
http://localhost:5000/oauth2
```

The Redirect URI is especially important. The URI you send in Step 1 must **exactly match** a valid redirect URI configured for the integration, and the same URI must be sent again in Step 2. ([Oracle Docs][2])

For REST Web Services, your scope will normally be:

```text
rest_webservices
```

For RESTlets:

```text
restlets
```

For both:

```text
restlets rest_webservices
```

In the URL this becomes:

```text
restlets+rest_webservices
```

---

# STEP 1 — Browser: Get Authorization Code

You will send a **GET** request to NetSuite's authorization endpoint.

The endpoint is:

```text
https://<ACCOUNT_ID>.app.netsuite.com/app/login/oauth2/authorize.nl
```

Oracle documents this as the authorization endpoint for the authorization-code flow. ([Oracle Docs][2])

For example:

```text
https://tstdrv1395241.app.netsuite.com/app/login/oauth2/authorize.nl
```

### Query parameters

You need:

```text
response_type=code
client_id=YOUR_CLIENT_ID
redirect_uri=http://localhost:5000/oauth2
scope=restlets rest_webservices
state=RANDOM_STRING
```

So conceptually:

```text
GET https://tstdrv1395241.app.netsuite.com/app/login/oauth2/authorize.nl
    ?response_type=code
    &client_id=YOUR_CLIENT_ID
    &redirect_uri=http://localhost:5000/oauth2
    &scope=restlets rest_webservices
    &state=ykv2XLx1BpT5Q0F3MRPHb94j
```

But because this is a URL, values should be URL encoded.

For example:

```text
http://localhost:5000/oauth2
```

becomes:

```text
http%3A%2F%2Flocalhost%3A5000%2Foauth2
```

And:

```text
restlets rest_webservices
```

can appear as:

```text
restlets+rest_webservices
```

Therefore your browser URL becomes something like:

```text
https://tstdrv1395241.app.netsuite.com/app/login/oauth2/authorize.nl?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Foauth2&scope=restlets+rest_webservices&state=ykv2XLx1BpT5Q0F3MRPHb94j
```

Paste that directly into the browser address bar.

### What happens?

NetSuite asks you to log in if necessary and then asks you to authorize the application/role.

After authorization, NetSuite redirects the browser to something similar to:

```text
http://localhost:5000/oauth2?state=ykv2XLx1BpT5Q0F3MRPHb94j&role=1000&entity=12&company=TSTDRV1395241&code=ABC123XYZ...
```

Oracle documents that successful redirects include values such as `state`, `role`, `entity`, `company`, and most importantly `code`. ([Oracle Docs][2])

Even if localhost isn't running and the browser shows:

```text
This site can't be reached
```

that's okay for this manual test.

Look at the browser address bar.

You need:

```text
code=ABC123XYZ...
```

Copy **only the value after `code=`**.

For example:

```text
code=70b827f926a512f098b1289f0991abe3c767947a43498c2e2f80ed5aef6a5c50
```

Copy:

```text
70b827f926a512f098b1289f0991abe3c767947a43498c2e2f80ed5aef6a5c50
```

Do this immediately because the authorization code has limited validity. ([Oracle Docs][2])

---

# STEP 2 — Postman: Exchange Code for Tokens

Now switch to Postman.

This is a **POST** request.

Use NetSuite's token endpoint:

```text
https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
```

For example:

```text
https://tstdrv1395241.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
```

This is the current token endpoint documented by Oracle. ([Oracle Docs][3])

## Postman Authorization tab

Go to:

```text
Authorization
```

Choose:

```text
Auth Type: Basic Auth
```

Now:

```text
Username: YOUR_CLIENT_ID
Password: YOUR_CLIENT_SECRET
```

For example:

```text
Username:
ewfeibrfibi4bi45987herbfebr

Password:
djbfree4875868bb
```

Postman will generate the Authorization header.

Conceptually NetSuite wants:

```text
client_id:client_secret
```

encoded and sent as:

```text
Authorization: Basic <encoded-value>
```

Oracle specifically requires HTTP Basic client authentication for a confidential client in this token request. ([Oracle Docs][3])

So you do **not** need to manually create the Base64/Base64url value if you use Postman's Basic Auth UI.

---

# STEP 2 — Headers

Go to Postman's **Headers** tab.

You need:

```text
Content-Type: application/x-www-form-urlencoded
```

And Postman will generate:

```text
Authorization: Basic <encoded-client-credentials>
```

So the important headers are effectively:

```http
Authorization: Basic xxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/x-www-form-urlencoded
```

Do **not** use:

```text
Content-Type: application/json
```

for this request.

Oracle specifically requires the token request parameters to use `application/x-www-form-urlencoded`. ([Oracle Docs][3])

You generally don't need to delete harmless automatically generated Postman headers such as:

```text
User-Agent
Accept
Accept-Encoding
Connection
Content-Length
Postman-Token
```

The important part is that you don't accidentally have a conflicting manually entered `Authorization` or `Content-Type` header.

---

# STEP 2 — Body

Go to:

```text
Body
```

Select:

```text
x-www-form-urlencoded
```

Do **not** select:

```text
raw
JSON
form-data
binary
```

Add these fields:

| Key            | Value                          |
| -------------- | ------------------------------ |
| `grant_type`   | `authorization_code`           |
| `code`         | authorization code from Step 1 |
| `redirect_uri` | `http://localhost:5000/oauth2` |

So Postman should effectively send:

```text
grant_type=authorization_code
code=YOUR_AUTHORIZATION_CODE
redirect_uri=http://localhost:5000/oauth2
```

Oracle requires `code`, `redirect_uri`, and `grant_type=authorization_code` for the exchange. ([Oracle Docs][3])

### Very important: Redirect URI

If Step 1 used:

```text
http://localhost:5000/oauth2
```

Step 2 must also use:

```text
http://localhost:5000/oauth2
```

Not:

```text
http://localhost:5000/oauth2/
```

and not:

```text
https://localhost:5000/oauth2
```

and not:

```text
http://localhost:5000
```

Use the same value.

---

# STEP 2 — Do NOT put these in Params

Your Postman **Params** tab should normally be empty.

Don't do:

```text
?grant_type=authorization_code&code=...
```

These values belong in:

```text
Body → x-www-form-urlencoded
```

The token request is therefore approximately:

```http
POST /services/rest/auth/oauth2/v1/token HTTP/1.1
Host: tstdrv1395241.suitetalk.api.netsuite.com
Authorization: Basic <encoded-client-id-and-client-secret>
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=YOUR_CODE&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Foauth2
```

That's the structure Oracle documents. ([Oracle Docs][3])

---

# STEP 2 — Response

Click:

```text
Send
```

If everything is correct, you'll receive JSON containing an access token and refresh token, similar to:

```json
{
    "access_token": "eyJraWQiOi...",
    "refresh_token": "eyJraWQiOi...",
    "expires_in": 3600,
    "token_type": "Bearer"
}
```

The important values are:

```text
access_token
refresh_token
expires_in
token_type
```

Keep the `refresh_token` securely. Don't expose your real client secret, authorization code, access token, or refresh token in screenshots, GitHub, frontend JavaScript, or public chats.

---

# STEP 3 — Use Access Token to Call NetSuite

Now you no longer need your Client ID/Client Secret for each REST Web Services request.

You authenticate the API request using:

```text
Authorization: Bearer ACCESS_TOKEN
```

Oracle documents this exact authorization format for REST Web Services. ([Oracle Docs][4])

For example, let's get customers.

### Request

```text
GET
```

URL:

```text
https://tstdrv1395241.suitetalk.api.netsuite.com/services/rest/record/v1/customer
```

In Postman go to:

```text
Authorization
```

Choose:

```text
Bearer Token
```

Token:

```text
YOUR_ACCESS_TOKEN
```

Postman generates:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

You could also manually put it under Headers:

```text
Authorization    Bearer YOUR_ACCESS_TOKEN
```

but don't do both.

### Headers

For a normal GET request:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
```

You don't need the Basic Auth Client ID/Client Secret anymore for this API call.

So:

```http
GET /services/rest/record/v1/customer HTTP/1.1
Host: tstdrv1395241.suitetalk.api.netsuite.com
Authorization: Bearer eyJraWQiOi...
Accept: application/json
```

Oracle's own Postman tutorial likewise obtains the OAuth token and then uses it in request headers to call REST Web Services. ([Oracle Docs][5])

---

# Complete flow visually

```text
                    STEP 1
                   BROWSER
                      │
                      │ GET
                      ▼
┌─────────────────────────────────────────┐
│ NetSuite Authorization Endpoint         │
│                                         │
│ /app/login/oauth2/authorize.nl          │
│                                         │
│ response_type=code                      │
│ client_id=CLIENT_ID                     │
│ redirect_uri=localhost                  │
│ scope=restlets rest_webservices         │
│ state=random                            │
└────────────────────┬────────────────────┘
                     │
                     │ Login + Allow
                     ▼
           NetSuite redirects to

 http://localhost:5000/oauth2
       ?state=xxxx
       &role=xxxx
       &entity=xxxx
       &company=xxxx
       &code=XXXXXXXXXXXX
                     │
                     │
                     │ Copy code
                     ▼

                    STEP 2
                   POSTMAN
                      │
                      │ POST
                      ▼
┌─────────────────────────────────────────┐
│ NetSuite Token Endpoint                 │
│                                         │
│ /services/rest/auth/oauth2/v1/token     │
│                                         │
│ Authorization: Basic                    │
│ Base64url(client_id:client_secret)      │
│                                         │
│ Content-Type:                           │
│ application/x-www-form-urlencoded       │
│                                         │
│ BODY:                                   │
│ grant_type=authorization_code           │
│ code=XXXXXXXX                           │
│ redirect_uri=http://localhost:5000/...  │
└────────────────────┬────────────────────┘
                     │
                     ▼

               JSON RESPONSE

        access_token
        refresh_token
        expires_in
        token_type
                     │
                     │
                     ▼

                    STEP 3
                   POSTMAN
                      │
                      │ GET/POST/etc.
                      ▼
┌─────────────────────────────────────────┐
│ NetSuite REST API                       │
│                                         │
│ /services/rest/record/v1/customer       │
│                                         │
│ Authorization:                          │
│ Bearer ACCESS_TOKEN                     │
└─────────────────────────────────────────┘
```

## Your exact Postman configuration

For your manual workflow, your screens should essentially look like this:

**Step 1 — Browser**

```text
Method:
GET

Endpoint:
https://<ACCOUNT_ID>.app.netsuite.com/app/login/oauth2/authorize.nl

Query:
response_type = code
client_id     = CLIENT_ID
redirect_uri = http://localhost:5000/oauth2
scope         = restlets rest_webservices
state         = RANDOM_STRING
```

**Step 2 — Postman**

```text
Method:
POST

URL:
https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token

Authorization:
Basic Auth

Username:
CLIENT_ID

Password:
CLIENT_SECRET

Headers:
Content-Type = application/x-www-form-urlencoded

Params:
EMPTY

Body:
x-www-form-urlencoded

grant_type   = authorization_code
code         = CODE_FROM_BROWSER
redirect_uri = http://localhost:5000/oauth2
```

**Step 3 — Postman**

```text
Method:
GET

URL:
https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/record/v1/customer

Authorization:
Bearer Token

Token:
ACCESS_TOKEN

Headers:
Accept = application/json

Params:
only whatever the particular REST API endpoint needs

Body:
EMPTY for this GET
```

That's the complete manual flow.

One additional point for future-proofing: Oracle currently says PKCE is optional in some authorization-code scenarios but required for public clients, and its documentation says that beginning with **NetSuite 2027.1**, `code_challenge` will be required for new OAuth 2.0 integrations regardless of client type. If you use PKCE, Step 1 adds `code_challenge`/`code_challenge_method`, and Step 2 adds `code_verifier`. ([Oracle Docs][2])

[Oracle — NetSuite OAuth 2.0 Authorization Code Grant Flow](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158074210415.html?utm_source=chatgpt.com)

[Oracle — Step 1: Authorization GET Request](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081944642.html?utm_source=chatgpt.com)

[Oracle — Step 2: Token POST Request](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_160855590788.html?utm_source=chatgpt.com)

[Oracle — Using OAuth 2.0 with REST Web Services](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157780312610.html?utm_source=chatgpt.com)

[1]: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158074210415.html?utm_source=chatgpt.com "NetSuite Applications Suite - OAuth 2.0 Authorization Code Grant Flow"
[2]: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081944642.html?utm_source=chatgpt.com "NetSuite Applications Suite - Step One GET Request to the Authorization Endpoint"
[3]: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_160855590788.html?utm_source=chatgpt.com "NetSuite Applications Suite - Step Two POST Request to the Token Endpoint"
[4]: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157780312610.html?utm_source=chatgpt.com "NetSuite Applications Suite - OAuth 2.0 for REST Web Services"
[5]: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0602033701.html?utm_source=chatgpt.com "NetSuite Applications Suite - Tutorial: Using Postman with OAuth 2.0"
