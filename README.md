openbadges-cem

Assets and planning for Open Badges platform for Connected Educator Month.

The site relies on [Bower](http://bower.io) for web libraries (like Foundation). To get started, `npm install; bower install`.

## Environment

These variables should be configured in your applications environment through env variables. An easy way to do that is create a config.env in your application directly that looks something like,

```
export OPENBADGER_URL='http://localhost:8000/v2/'
export OPENBADGER_SECRET='lecarre'
export AESTIMIA_URL='http://localhost:9999/api/'
export AESTIMIA_SECRET='rendell'
export CEM_HOST='localhost:3000'
export MANDRILL_KEY='fattington'
export REVIEWER_EMAIL='reviewer@reviewsite.com'
```

Then you can source the file like `. config.env`.