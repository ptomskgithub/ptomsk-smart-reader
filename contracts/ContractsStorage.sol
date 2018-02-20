pragma solidity ^0.4.18;


import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';


contract ContractsStorage is Ownable {
    struct Contract {
        string title;
        string content;

        uint sign_block_count1;

        uint sign_block_count2;

        bool is_signed;

        uint block_count;
    }

    address public signer1;
    address public signer2;

    mapping (string => Contract) contracts;

    modifier onlySigners() {
        require((msg.sender == signer1) || (msg.sender == signer2));
        _;
    }

    function ContractsStorage(address _signer1, address _signer2) public {
        signer1 = _signer1;
        signer2 = _signer2;
    }

    function addContract(string _unique, string _title, string _content) onlyOwner public {
        require(contracts[_unique].block_count == 0);

        contracts[_unique] = Contract({
            title: _title,
            content: _content,

            sign_block_count1: 0,
            sign_block_count2: 0,
            is_signed: false,

            block_count: block.number
        });
    }

    function signContract(string _unique) onlySigners public {
        Contract storage c = contracts[_unique];

        require(c.block_count != 0);
        require(c.is_signed == false);

        if (signer1 == msg.sender) {
            require(c.sign_block_count1 == 0);
            c.sign_block_count1 = block.number;
            if (c.sign_block_count2 > 0) {
                c.is_signed = true;
            }
        } else if (signer2 == msg.sender) {
            require(c.sign_block_count2 == 0);
            c.sign_block_count2 = block.number;
            if (c.sign_block_count2 > 0) {
                c.is_signed = true;
            }
        } else {
            require(false);
        }
    }

    function getContract(string _unique) public constant returns(string, string, address, uint, address, uint, bool, uint) {
        Contract storage c = contracts[_unique];
        return (c.title, c.content,
                signer1, c.sign_block_count1,
                signer2, c.sign_block_count2,
                c.is_signed, c.block_count);
    }
}
