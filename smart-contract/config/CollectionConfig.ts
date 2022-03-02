import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import whitelistAddresses from './whitelist.json';

const CollectionConfig: CollectionConfigInterface = {
  // The contract name can be updated using the following command:
  // yarn rename-contract NEW_CONTRACT_NAME
  // Please DO NOT change it manually!
  contractName: 'BabyDevs',
  tokenName: 'Baby Devs',
  tokenSymbol: 'BDS',
  hiddenMetadataUri: 'https://minipancake.xyz/babydevs/json/hidden.json',
  maxSupply: 6666,
  maxMintAmount: 9,
  whitelistSale: {
    price: 0.09,
    maxMintAmountPerTx: 3,
    
  },
  preSale: {
    price: 0.07,
    maxMintAmountPerTx: 3,
  
  },
  publicSale: {
    price: 0.12,
    maxMintAmountPerTx: 5,
    
  },
  contractAddress: "0x192EA0F211f48CabF24c3cB05759847c91ED39eD",
  openSeaSlug: 'Baby Devs',
  whitelistAddresses: whitelistAddresses,
};

export default CollectionConfig;
