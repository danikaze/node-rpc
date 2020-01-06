# node-rpc

> Client-server architecture to communicate different node processes via sockets

Status of the `master` branch:

[![Build Status](https://travis-ci.org/danikaze/node-rpc.svg?branch=master)](https://travis-ci.org/danikaze/node-rpc)

## Usage

Installation:

```
npm install
npm build
```

That will generate an `app` folder with two subfolders:

- `entries`: With the entry points of each programs
- `rpc`: With the list of different implementations to load by the clients

A special entry is `app/client-filename` wich loads any `rpc` file specified by `--file` like:

```
node app/entries/client-filename.js --file=draw-timeout.js
```

will load the client with the implementation in `app/rpc/draw-timeout.js`

## Developing

Running the following command will start the `watch` process which will generate the needed files into the `app` folder.

```
npm run dev
```

The code is placed inside the `src` folder, which structure is broken into four big sub-folders:

- `entries`: Every file here will generate an entry file into `app/entries` with the same folder structure. Keep this files simple, including the code from other place.
- `games`: Here is where the logic for each _game_ should be implemented, since the code inside this folder won't generate any bundle. Then, the code here should be imported in the previously mentioned entries
- `rpc`: Every file here will also generate an entry file into `app/rpc`. Those are the files that will be loaded dynamically as implementation of the client interfaces.
- `utils`: is for library-like functions. Helpers that can be used in any place of the code
