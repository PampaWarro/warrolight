// import {Func} from "./rainbow";
const _ = require('lodash')

module.exports = function getShapes(mapping) {
    const inv = arr => [].concat(arr).reverse()

    // Una permutación random de todas las luces. PSYCHO MIND FUCK
    const shuffle = _.shuffle(_.range(0, 150))

    // Una permutación random de pedazos de a 20 luces
    const shuffleSegments5 = _.flatten(_.shuffle(_.map(_.range(0, 150 / 5), i => _.range(i * 5, (i + 1) * 5))))
    const shuffleSegments10 = _.flatten(_.shuffle(_.map(_.range(0, 150 / 10), i => _.range(i * 10, (i + 1) * 10))))
    const shuffleSegments20 = _.flatten(_.shuffle(_.map(_.range(0, 7), i => _.range(i * 20, (i + 1) * 20))))

    const wingsLeft = _.range(0, 150);
    const wingsRight = _.range(150, 300);
    const allOfIt = _.range(0, 150).concat(_.range(299, 151))
    const Warro = allOfIt;
    return {
        allOfIt,
        wingsLeft,
        wingsRight,
        Warro
    };
}


