# Blog - Express

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Usage](#usage)
- [Contributing](../CONTRIBUTING.md)

## About <a name = "about"></a>

This is a basic blog app made using Express framework. App uses Mongodb and Postgresql database. It uses Cloudinary hosting to store the images to the server.


## Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

### Prerequisites

What things you need to install the software and how to install them.

```
nodejs
npm
postgresql
mongodb
```

### Installing

Clone the repo and run the following command to install required dependencies

```
npm i 
```

In case you want to modify the postgres and mongodb database details:
- Mongodb string has been placed in ".env" file
- Postgres database details are in "blog-service.js" file
- Cloudinary details are in "server.js" file


## Usage <a name = "usage"></a>

Users can create and login to their account.