// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import contracts_storate_artifacts from '../ContractsStorage.json'

var ladda = require('ladda');
window.ladda = ladda;

window.App = {

  url_param: function(name) {
    var url = window.location.href;
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
    if (!results) {
        return undefined;
    }
    return results[1] || undefined;
  },

  start: function() {
    var id = this.url_param('id');
    var network = this.url_param('network') || 'ropsten';
    var contract_address = this.url_param('contract_address');
    if (id && network && contract_address) {
      $('#id_get').val(id);
      $('#network option[value=' + network + ']').attr('selected', 'selected');
      $('#id_contract').val(contract_address);
      this.getContract(id, network, contract_address, false);
    }
  },

  getContract: function(id, network, contract_address, push_state) {
    $('#contract_info_holder').hide();

    if (push_state) {
        var state = {
            'network': network,
            'id': id,
            'contract_address': contract_address
        };
        history.pushState(state, document.title, location.pathname + '?' + $.param(state));
    }

    var web3;
    if (network == 'live') {
      $('#test-net').hide();
      web3 = this.create_web3('live');
    } else {
      $('#test-net').show();
      web3 = this.create_web3('ropsten');
    }
    var ContractsStorage = contract(contracts_storate_artifacts);
    ContractsStorage.setProvider(web3.currentProvider);

    $('#contract_not_found_holder').show();
    var spinner = ladda.create(document.getElementById('get_contract'));
    spinner.start();
    var that = this;
    ContractsStorage.at(contract_address).then(function(store) {
        store.getContract(id).then(function (value) {
            spinner.stop();

            if (value[7].c[0]) {
                $('#contract_not_found_holder').hide();
                $('#contract_info_holder').show();
                $('#get_title').html(value[0]);
                $('#get_content').html(value[1].replace(/\n/ig, "<br/>"));
                $('#get_signed1').html(value[2]);
                $('#get_block1').html(value[3].c[0]);
                $('#get_signed2').html(value[4]);
                $('#get_block2').html(value[5].c[0]);
                $('#is_signed').html(value[6] ? 'Yes' : 'No');
                $('#link_to_smart').attr('href', that.get_address_link(network, contract_address));
            } else {
                $('#contract_not_found_holder').show();
                $('#contract_info_holder').hide();
            }
        }).catch(function () {
            alert('Error in loading info');
            spinner.stop();
        });
    }).catch(function(){
        spinner.stop();
    });
  },

  create_web3: function(network_name) {
    if (network_name == 'live') {
      return new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"));
    } else {
      return new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
    }
  },

  get_address_link: function(network_name, address) {
    if (network_name == 'live') {
      return 'https://etherscan.io/address/' + address.toString();
    } else {
      return 'https://ropsten.etherscan.io/address/' + address.toString();
    }
  }
};


window.addEventListener('load', function() {
  App.start();
});

$(document).on('keypress', '#id_get', function(){
  $('#contract_not_found_holder').hide();
  $('#contract_info_holder').hide();
});

$(document).on('change', '#network', function(){
  $('#contract_not_found_holder').hide();
  $('#contract_info_holder').hide();
});