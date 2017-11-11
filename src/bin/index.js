#!/usr/bin/env node

import yargs from 'yargs';

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error(reason);

  // eslint-disable-next-line no-process-exit
  process.exit();
});

process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error(error);

  // eslint-disable-next-line no-process-exit
  process.exit();
});

yargs
  .env('POSTLOADER')
  .commandDir('commands')
  .help()
  .wrap(80)
  .parse();
