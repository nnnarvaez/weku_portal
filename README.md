
WeKu Website

## Installation

#### Clone the repository and make a tmp folder
```bash
git clone https://github.com/nnnarvaez/weku_portal.git
cd weku_portal
mkdir tmp
yarn global add babel-cli
yarn install
yarn run build
yarn run prod1

```

#### Alterative method | Clone the repository and make a tmp folder
```bash
git clone https://github.com/nnnarvaez/weku_portal.git
cd weku_portal
mkdir tmp
yarn global add babel-cli
yarn install --frozen-lockfile
yarn run build
yarn run prod1

```

To run website in production mode, run:

It will run in port 8080

```bash
sudo npm run production
```

To run condenser in development mode, run:

```bash
sudo npm run start
```

#### Configuration
Move to config folder and copy `defaults.json` to `production.json`
There you need to define the RPC nodes, the server secret and the mysql database

If you're intending to run condenser in a production environment one
configuration option that you will definitely want to edit is
`server_session_secret` To generate a new value for this setting, you can
do this:

```bash
node
> crypto.randomBytes(32).toString('base64')
> .exit
```

Edit `config/production.json` and define the database parameters: using the format `mysql://user:pass@hostname/databasename`.

#### You need mysql server

Recommended version 5.7.16

#### Database migrations

This is a required step in order for the database to be 'ready' for website's use.


Edit the file `src/db/config/config.json` using your favorite command line text editor being sure that the username, password, host, and database name are set correctly and match your newly configured mysql setup.

Run `sequelize db:migrate` in `src/db` directory, like this:

```bash
cd src/db
yarn exec sequelize db:migrate
```

