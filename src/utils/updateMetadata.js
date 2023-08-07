let fs = require('fs');

for(let i = 1; i <= 2; i++) {
    var name = './public/nft/api/' + i + '.json';
    var m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmVkbWgNadsKVX1eYRj3EmbjHM3TdDqidMy6T4hoC2SJJR/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 3; i <= 3; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmY28DMHo2uc1KVDT1yke4Ugj9r9H8qEPgoLjZPSfjdBo2/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 4; i <= 780; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmSd91E9mm3NwE6wZ2RcQKdwBdTk1mXd6vt6nzHkktXC7Q/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 781; i <= 1570; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmWW9uLFbRbeqtVsY3F7XvXnpsW43Xd5Kj3W6q8uWaWszD/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 1571; i <= 2320; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmbaZLMeyXUnEsFk1tHsaqDPZNNyB2GXHwNpywRCcvGRLQ/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 2321; i <= 3100; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://Qmd7TbE3NfWqSoPF2xkC7bDsgRQjnotQRyKoMTm13ub2NY/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}

for(let i = 3101; i <= 3333; i++) {
    let name = './public/nft/api/' + i + '.json';
    let m = JSON.parse(fs.readFileSync(name).toString());
    m.image = 'ipfs://QmSaBELNanFxRXQRKDa96TGiQkzhJMpTYHgHMBPzPyqrd5/' + i + '.png';
    fs.writeFileSync(name, JSON.stringify(m));
}