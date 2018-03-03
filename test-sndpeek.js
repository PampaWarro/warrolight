const _ = require("lodash");

const term = require( 'terminal-kit' ).terminal ;

const sndpeek = require('sndpeek');
const Table = require('cli-table2');

sndpeek.startListening();

sndpeek.on('data', function({centroid, flux, rms, mffc, ...other}) {
  term.saveCursor();
  term.eraseDisplayBelow();

  term(new Date()+"\n")

  let table = new Table({colWidths: _.range(0,5).map(()=>10), wordWrap: true});
  table.push([centroid,flux, Math.round(rms*10000)]);

  term(table.toString())

  term.restoreCursor();
});