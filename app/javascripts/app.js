// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import {default as Web3} from 'web3';
import {default as contract} from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import contracts_storate_artifacts from '../ContractsStorage.json'

var request = require('request');
var hdkey = require('ethereumjs-wallet/hdkey');

var abiDecoder = require('abi-decoder');
abiDecoder.addABI(contracts_storate_artifacts['abi']);

var ladda = require('ladda');
window.ladda = ladda;

window.App = {
  url_param: function (name) {
    var url = window.location.href;
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
    if (!results) {
      return undefined;
    }
    return decodeURIComponent(results[1]) || undefined;
  },

  start: function () {
    var id = this.url_param('id');
    var network = this.url_param('network') || 'ropsten';
    var contract_address = this.url_param('contract_address');
    var search = this.url_param('search');

    if (id && network && contract_address) {
      $('#id_get').val(id);
      $('#network option[value=' + network + ']').attr('selected', 'selected');
      $('#id_contract').val(contract_address);

      $('.panels').hide();
      $('#contract_loading').show();
      var spinner = ladda.create(document.getElementById('get_contract'));
      spinner.start();
      show_contract(id, network, contract_address).then(function () {
        spinner.stop();
      }).catch(function () {
        spinner.stop();
      });
    } else if (search) {
      $('#search_toolbar_input').val(search);
      do_search(search);
    }
  }
};


function show_contract(id, network, contract_address) {
  var state = {
    'network': network,
    'id': id,
    'contract_address': contract_address
  };
  history.pushState(state, document.title, location.pathname + '?' + $.param(state));

  var web;
  if (network == 'live') {
    $('#test-net').hide();
    web = create_web3('live');
  } else {
    $('#test-net').show();
    web = create_web3('ropsten');
  }
  var ContractsStorage = contract(contracts_storate_artifacts);
  ContractsStorage.setProvider(web.currentProvider);

  return ContractsStorage.at(contract_address).then(function (store) {
    store.getContract(id).then(function (value) {
      if (value[7].c[0]) {
        $('.panels').hide();

        $('#contract_info_holder').show();
        $('#get_title').html(value[0]);
        $('#get_content').html(value[1].replace(/\n/ig, "<br/>"));
        $('#get_signed1').html(get_company_name(value[2]));
        $('#get_block1').html(value[3].c[0]);
        $('#get_signed2').html(get_company_name(value[4]));
        $('#get_block2').html(value[5].c[0]);
        $('#is_signed').html(value[6] ? 'Yes' : 'No');
        $('#link_to_smart').attr('href', get_address_link(network, contract_address));
      } else {
        show_not_found();
      }
    }).catch(function () {
      alert('Error in loading info');
    });
  })
}


function show_not_found() {
  $('.panels').hide();
  $('#contract_not_found_holder').show();
}


function get_address_link(network_name, address) {
  if (network_name == 'live') {
    return 'https://etherscan.io/address/' + address.toString();
  } else {
    return 'https://ropsten.etherscan.io/address/' + address.toString();
  }
}


function is_hash(str) {
  if (!str || !str.length) {
    return false;
  }

  if ((str.substring(0, 2) == '0x') && (str.length == 66) && str.match(/^0x[0-9a-f]+$/i)) {
    return true;
  } else {
    return false;
  }
}


function is_telegram_id(str) {
  if (!str || !str.length) {
    return false;
  }

  if (parseInt(str).toString() == str) {
    return true;
  } else {
    return false;
  }
}


function is_input_data(str) {
  if (!str || !str.length) {
    return false;
  }

  if ((str.substring(0, 2) == '0x') && str.match(/^0x[0-9a-f]+$/i)) {
    return true;
  } else {
    return false;
  }
}


function get_transaction_data(network, hash) {
  return new Promise(function (resolve, reject) {
    var web = create_web3(network);
    web.eth.getTransaction(hash, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}


function create_web3(network_name) {
  if (network_name == 'live') {
    return new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"));
  } else {
    return new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
  }
}


function decode_transation_input(input) {
  return abiDecoder.decodeMethod(input);
  //return decoder.decodeData(input);
}


function get_network_name(telegram_id) {
  var TELEGRAM_IDS = [
    123,
    29440899,
    524224540,
    468972296,
    510689101,
    565024298,
    433716510
  ];
  if (TELEGRAM_IDS.indexOf(parseInt(telegram_id)) !== -1) {
    return 'live';
  } else {
    return 'ropsten';
  }
}


function get_extended_public_key(network) {
  if (network == 'live') {
    return 'xpub6DwtYwW2zgHhk64HzNF5NuKsrGAMbt55ao8XTFjtzzd2HBZhFZuNMGy2jdb2Xyj7FZZnNktTnj3wBe9eb77Z5M4f7489Wv5gquHx4qp7SSv';
  } else {
    return 'xpub6F5xcs8nujjZDskV4PA3ucarErCnVKCTtjQSwty9FwS4jhdekFo1ae2JZTNiJV8q1MDRsytjowAURyRG4mHBRQeLZtxCHH1BRycxjy78XiV';
  }
}


var TELEGRAM_TO_NAME = {
  29440899: 'Петролеум Трейдинг',
  433716510: 'Ромашка',
  524224540: 'РС-ОйлОпт',
  510689101: 'ООО "ТРАСТ ТЭК"',
  468972296: 'ООО Управление АЗС'
};
var ADDRESS_TO_NAME = {};
var wallet = get_wallet_from_telegram_id('live', 0);
ADDRESS_TO_NAME[get_public_key(wallet).toLowerCase()] = 'Петролеум Трейдинг';
var wallet = get_wallet_from_telegram_id('ropsten', 0);
ADDRESS_TO_NAME[get_public_key(wallet).toLowerCase()] = 'Петролеум Трейдинг';

for (var id in TELEGRAM_TO_NAME) {
  var name = TELEGRAM_TO_NAME[id];
  var address = get_contract_address(id);
  ADDRESS_TO_NAME[address.toLowerCase()] = name;
}


function get_company_name(address) {
  return ADDRESS_TO_NAME[address.toLowerCase()] || address;
}


function get_address_indexes(number) {
  var BASE = 1000000;
  var parts = [];
  while (number > BASE) {
    var part = Math.floor(number / BASE);
    number = number % BASE;
    parts.push(part.toString());
  }
  parts.push(number);
  return parts;
}


function get_wallet_from_telegram_id(network, telegram_id) {
  var wallet = hdkey.fromExtendedKey(get_extended_public_key(network));
  var parts = get_address_indexes(telegram_id);
  for (var i in parts) {
    var part = parts[i];
    wallet = wallet.deriveChild(part);
  }
  return wallet.getWallet();
}


function get_public_key(wallet) {
  var address = "0x" + wallet.getAddress().toString("hex");
  return address;
}


function get_contract_address(telegram_id) {
  var network = get_network_name(telegram_id);
  var w = get_wallet_from_telegram_id(network, telegram_id);
  return get_public_key(w);
}


function get_transactions(network, address) {
  if (network == 'live') {
    var domain = 'https://api.etherscan.io';
  } else {
    var domain = 'https://ropsten.etherscan.io';
  }
  var url = domain + '/api?module=account&action=txlist&address=' + address.toString() + '&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken';
  return new Promise(function (resolve, reject) {
    request.get({
      url: url,
      json: true,
    }, (err, res, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data['result']);
      }
    });
  });
}


window.addEventListener('load', function () {
  App.start();
});


$(document).on('submit', '#search_form', function () {
  var str = $('#search_toolbar_input').val();
  do_search(str);
  return false;
});


function show_contracts(contracts) {
  $('#contracts_list tbody').html('');
  $('#contracts_list').show();
  for (var i in contracts) {
    var c = contracts[i];
    $('#contracts_list tbody').append('<tr><td>' + c.id + '</td><td><a href="' + c.url + '">Smartcontract reader</a></td><td>' + c.title + '</td></tr>')
  }
}


function find_by_hash(hash) {
  var network, contract_address;
  var spinner = ladda.create(document.getElementById('search_button'));
  spinner.start();

  var promises = [
    get_transaction_data('ropsten', hash),
    get_transaction_data('live', hash)
  ];

  Promise.all(promises).then(function (ress) {
    if (ress[0]) {
      network = 'ropsten';
      contract_address = ress[0].to;
      var res = decode_transation_input(ress[0].input);
      if (res && res.name == 'addContract') {
        var id = res.params[0].value;
        show_contract(id, network, contract_address);
      } else if (res && res.name == 'signContract') {
        var id = res.params[0].value;
        show_contract(id, network, contract_address);
      } else {
        show_not_found();
      }
    } else if (ress[1]) {
      network = 'live';
      contract_address = ress[1].to;
      var res = decode_transation_input(ress[1].input);
      if (res && res.name == 'addContract') {
        var id = res.params[0].value;
        show_contract(id, network, contract_address);
      } else if (res && res.name == 'signContract') {
        var id = res.params[0].value;
        show_contract(id, network, contract_address);
      } else {
        show_not_found();
      }
    } else {
      show_not_found();
    }
    spinner.stop();
  }).catch(function (e) {
    alert('Could not find contract');
    console.log(e.toString());
    spinner.stop();
  });
}


function find_by_input_data(input) {
  var spinner = ladda.create(document.getElementById('search_button'));
  spinner.start();

  var res = decode_transation_input(input);
  var id;
  if (res && res.name == 'addContract') {
    id = res.params[0].value;
  } else if (res && res.name == 'signContract') {
    id = res.params[0].value;
  } else {
    alert('Could not find contract');
    spinner.stop();
  }

  function find_contract_by_id(network, transactions, contract_id) {
    for (var i in transactions) {
      var trans = transactions[i];
      var data = decode_transation_input(trans['input']);
      if (data && (data['name'] === 'addContract')) {
        var id = data['params'][0]['value'];
        var title = data['params'][1]['value'];
        var url = 'index.html?id=' + id + '&network=' + network + '&contract_address=' + trans['to'];

        if (id == contract_id) {
          return {
            'id': id,
            'title': title,
            'url': url,
            'network': network,
            'contract_address': trans['to'],
          };
        }
      } else if (data && (data['name'] === 'signContract')) {
        var id = data['params'][0]['value'];
        var url = 'index.html?id=' + id + '&network=' + network + '&contract_address=' + trans['to'];

        if (id == contract_id) {
          return {
            'id': id,
            'title': '',
            'url': url,
            'network': network,
            'contract_address': trans['to'],
          };
        }
      }
    }
  }

  if (id) {
    var live_address = get_public_key(get_wallet_from_telegram_id('live', 0));
    var ropsten_address = get_public_key(get_wallet_from_telegram_id('ropsten', 0));

    var promises = [
      get_transactions('live', live_address),
      get_transactions('ropsten', ropsten_address)
    ];
    Promise.all(promises).then(function (res) {
      var contract;
      var trans_live = res[0];
      var trans_ropsten = res[1];

      contract = find_contract_by_id('live', trans_live, id);
      if (!contract) {
        contract = find_contract_by_id('ropsten', trans_ropsten, id);
      }

      if (contract) {
        show_contract(contract.id, contract.network, contract.contract_address);
      } else {
        show_not_found();
      }
    }).catch(function (e) {
      alert('Could not find contract');
      console.log(e.toString());
      spinner.stop();
    });
  }
}


function find_by_telegram_id(telegram_id) {
  var spinner = ladda.create(document.getElementById('search_button'));
  spinner.start();
  var network = get_network_name(telegram_id);
  var contract_address = get_contract_address(telegram_id).toLowerCase();
  var main_address = get_public_key(get_wallet_from_telegram_id(network, 0));

  var contracts = [];
  Promise.all([
    get_transactions(network, main_address),
    get_transactions(network, contract_address),
  ]).then(function (res) {
    var main_transactions = res[0];
    var client_transactions = res[1];

    // get contract addresses
    var contract_addresses = [];
    for (var i in client_transactions) {
      var trans = client_transactions[i];
      var data = decode_transation_input(trans['input']);
      if (data && (data['name'] === 'signContract')) {
        if (contract_addresses.indexOf(trans['to'].toLowerCase()) === -1) {
          contract_addresses.push(trans['to'].toLowerCase());
        }
      }
    }

    if (contract_addresses.length) {
      for (var i in main_transactions) {
        var trans = main_transactions[i];
        var data = decode_transation_input(trans['input']);

        if (data && (data['name'] === 'addContract') && (contract_addresses.indexOf(trans['to'].toLowerCase()) !== -1)) {
          var id = data['params'][0]['value'];
          var title = data['params'][1]['value'];
          var url = 'index.html?id=' + id + '&network=' + network + '&contract_address=' + trans['to'];
          contracts.push({
            'id': id,
            'url': url,
            'network': network,
            'contract_address': trans['to'],
            'title': title
          });
        }
      }
    }

    if (contracts.length) {
      show_contracts(contracts);
    } else {
      show_not_found();
    }
    spinner.stop();
  }).catch(function (e) {
    alert('Could not find contract');
    console.log(e.toString());
    spinner.stop();
  });
}


function find_by_text(str) {
  var spinner = ladda.create(document.getElementById('search_button'));
  spinner.start();
  var search = str.toLowerCase();
  var live_address = get_public_key(get_wallet_from_telegram_id('live', 0));
  var ropsten_address = get_public_key(get_wallet_from_telegram_id('ropsten', 0));

  var promises = [
    get_transactions('live', live_address),
    get_transactions('ropsten', ropsten_address)
  ];
  Promise.all(promises).then(function (res) {
    var trans_live = res[0];
    var trans_ropsten = res[1];

    function process_trans(network, trans) {
      var data = decode_transation_input(trans['input']);
      if (data && (data['name'] === 'addContract')) {
        var id = data['params'][0]['value'];
        var title = data['params'][1]['value'].toLowerCase();
        var content = data['params'][2]['value'].toLowerCase();
        var url = 'index.html?id=' + id + '&network=' + network + '&contract_address=' + trans['to'];

        if ((title.indexOf(search) > -1) || (content.indexOf(search) > -1)) {
          return {
            'id': id,
            'title': title,
            'url': url,
            'network': network,
            'contract_address': trans['to'],
          };
        }
      }
    }

    var contracts = [];
    for (var i in trans_live) {
      var trans = trans_live[i];
      var res = process_trans('live', trans);
      if (res) {
        contracts.push(res);
      }
    }

    for (var i in trans_ropsten) {
      var trans = trans_ropsten[i];
      var res = process_trans('ropsten', trans);
      if (res) {
        contracts.push(res);
      }
    }

    if (contracts.length) {
      show_contracts(contracts);
    } else {
      show_not_found();
    }

    spinner.stop();
  }).catch(function (e) {
    alert('Could not find contract');
    console.log(e.toString());
    spinner.stop();
  });
}


function do_search(str) {
  $('.panels').hide();
  if (!str) {
    return false;
  }

  var state = {
    'search': str,
  };
  history.pushState(state, document.title, location.pathname + '?' + $.param(state));

  if (is_hash(str)) {
    find_by_hash(str);
  } else if (is_input_data(str)) {
    find_by_input_data(str);
  } else if (is_telegram_id(str)) {
    var telegram_id = parseInt(str);
    find_by_telegram_id(telegram_id);
  } else {
    find_by_text(str);
  }

  return false;
};