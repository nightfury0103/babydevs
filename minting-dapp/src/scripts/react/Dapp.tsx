import React from 'react';
import { ethers, BigNumber } from 'ethers'
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import NftContractType from '../lib/NftContractType';
import CollectionConfig from '../../../../smart-contract/config/CollectionConfig';
import CollectionStatus from './CollectionStatus';
import MintWidget from './MintWidget';
import Whitelist from '../lib/Whitelist';

const ContractAbi = require('../../../../smart-contract/artifacts/contracts/' + CollectionConfig.contractName + '.sol/' + CollectionConfig.contractName + '.json').abi;

interface Props {
}

interface State {
  userAddress: string|null;
  network: ethers.providers.Network|null,
  totalSupply: number;
  maxSupply: number;
  maxMintAmountPerTx: number;
  tokenPrice: BigNumber;
  isPaused: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
  merkleProofManualAddress: string;
  merkleProofManualAddressFeedbackMessage: string|JSX.Element|null;
  etherscanUrl: string,
  errorMessage: string|JSX.Element|null,
}

const defaultState: State = {
  userAddress: null,
  network: null,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isPaused: true,
  isWhitelistMintEnabled: false,
  isUserInWhitelist: false,
  merkleProofManualAddress: '',
  merkleProofManualAddressFeedbackMessage: null,
  etherscanUrl: '',
  errorMessage: null,
};

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider;

  contract!: NftContractType;

  private merkleProofManualAddressInput!: HTMLInputElement;

  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  componentDidMount = async () => {
    // Update the default state with a generic URL before we know the actual network through the connected wallet
    defaultState.etherscanUrl = this.generateEtherscanUrl();
    const browserProvider = await detectEthereumProvider() as ExternalProvider;

    if (browserProvider?.isMetaMask !== true) {
      this.setState({
        errorMessage: 
        <>
          Unable to detect <strong>MetaMask</strong>. Go to the Metamask website. <br /> Click “Get Chrome Extension” to install Metamask.<br />Click “Add to Chrome” in the upper right.<br />Click “Add Extension” to complete the installation. ...<br />Click on the Metamask logo in the upper right hand corner of your Google chrome browser..<br />
          <br />
          But don't worry! <span className="emoji">😃</span> You can interact with the smart-contract through <a href={defaultState.etherscanUrl} target="_blank">Etherscan</a> and <strong>we do our best to provide you with the best user experience possible</strong>, even from there.<br />
          <br />
          You can also get your <strong>Whitelist Proof</strong> manually, using the tool below.
        </>,
      });
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider);

    this.registerWalletEvents(browserProvider);

    await this.initWallet();
  }

  async mintTokens(amount: number): Promise<void>
  {
    try {
      await this.contract.mint(amount, {value: this.state.tokenPrice.mul(amount)});
    } catch (e) {
      this.setError(e);
    }
  }

  async whitelistMintTokens(amount: number): Promise<void>
  {
    try {
      await this.contract.whitelistMint(amount, Whitelist.getProofForAddress(this.state.userAddress!), {value: this.state.tokenPrice.mul(amount)});
    } catch (e) {
      this.setError(e);
    }
  }

  private isWalletConnected(): boolean
  {
    let md: HTMLElement | null = document.getElementById('minting-dapp');
    if (!this.state.userAddress) {
      md?.classList.remove("minting-dapp-active");
    }
    return this.state.userAddress !== null;
  }

  private isContractReady(): boolean
  {
    let md: HTMLElement | null = document.getElementById('minting-dapp');
    if (this.contract && this.state.totalSupply < this.state.maxSupply) {
      console.log(this.contract, "contract");
      md?.classList.add("minting-dapp-active");
    }
    else {
      md?.classList.remove("minting-dapp-active");
    }
    return this.contract !== undefined;
  }

  private isSoldOut(): boolean
  {
    return this.state.maxSupply !== 0 && this.state.totalSupply < this.state.maxSupply;
  }

  private isNotMainnet(): boolean
  {
    return this.state.network !== null && this.state.network.chainId !== 1;
  }

  private copyMerkleProofToClipboard(): void
  {
    const merkleProof = Whitelist.getRawProofForAddress(this.state.userAddress ?? this.state.merkleProofManualAddress);

    if (merkleProof.length < 1) {
      this.setState({
        merkleProofManualAddressFeedbackMessage: 'The given address is not in the whitelist, please double-check.',
      });

      return;
    }

    navigator.clipboard.writeText(merkleProof);

    this.setState({
      merkleProofManualAddressFeedbackMessage: 
      <>
        <strong>Congratulations!</strong> <span className="emoji">🎉</span><br />
        Your Merkle Proof <strong>has been copied to the clipboard</strong>. You can paste it into <a href={this.state.etherscanUrl} target="_blank">Etherscan</a> to claim your tokens.
      </>,
    });
  }

  render() {
    return (
      <>
        {/* {this.isNotMainnet() ?
          <div className="not-mainnet">
            You are not connected to the main network.
            <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
          </div>
          : null}

        {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button onClick={() => this.setError()}>Close</button></div> : null} */}
        
        {this.isWalletConnected() ?
          <>
            {this.isContractReady() ?
              <>
                <div className="envolve">
                  {this.isNotMainnet() ?
                    <div className="not-mainnet">
                      You are not connected to the Ethereum Network.
                      <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
                    </div>
                    : null}

                  {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button onClick={() => this.setError()}>Close</button></div> : null}
                  <CollectionStatus
                    userAddress={this.state.userAddress}
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    tokenPrice={this.state.tokenPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens={(mintAmount) => this.whitelistMintTokens(mintAmount)}
                  />
                </div>
                {this.state.totalSupply < this.state.maxSupply ?
                  <MintWidget
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPrice={this.state.tokenPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens={(mintAmount) => this.whitelistMintTokens(mintAmount)}
                  />
                  :
                  <div className="collection-sold-out">
                    <h2>BabyDevs are <strong>SOLD OUT</strong>! <span className="emoji">🥳</span></h2>

                    You can buy from our beloved holders on <a href={this.generateOpenSeaUrl()} target="_blank">OpenSea</a>.
                  </div>
                }
              </>
              :
              <div className="collection-not-ready">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                Loading collection data...
              </div>
            }
          </>
        : 
        <>
          {this.isNotMainnet() ?
            <div className="not-mainnet">
              You are not connected to the main network.
              <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
            </div>
            : null}

          {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button onClick={() => this.setError()}>Close</button></div> : null}
        </>
        }

        {!this.isWalletConnected() || !this.isSoldOut() ?
          <div className="no-wallet">
            {!this.isWalletConnected() ? <button className="primary" disabled={this.provider === undefined} onClick={() => this.connectWallet()}>Connect Wallet</button> : null}
            
            <div className="use-etherscan">
              Welcome to the <strong> !!!!!</strong><br />
              Please connect to your <strong>METAMASK</strong> <br /><br />
              <strong>No Metamask ? No probblem </strong><br />  Go to the Metamask website. <br /> Click “Get Chrome Extension” to install Metamask.<br />Click “Add to Chrome” in the upper right.<br />Click “Add Extension” to complete the installation. ...<br />Click on the Metamask logo in the upper right hand corner of your Google chrome browser..<br />
              <br /> You can interact with the smart-contract <strong>directly</strong> through <a href={this.state.etherscanUrl} target="_blank">Etherscan</a>
              <br />
             
            </div>
          </div>
          : null}
      </>
    );
  }

  private setError(error: any = null): void
  {
    let errorMessage = 'Unknown error...';

    if (null === error || typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      // Support any type of error from the Web3 Provider...
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message;
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message;
      } else if (error?.message !== undefined) {
        errorMessage = error.message;
      }
    }

    this.setState({
      errorMessage: null === errorMessage ? null : errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    });
  }

  private generateEtherscanUrl(): string
  {
    return `https://${this.state.network?.chainId === 1 || !this.state.network?.name ? 'www' : this.state.network.name}.etherscan.io/address/${CollectionConfig.contractAddress}`;
  }

  private generateOpenSeaUrl(): string
  {
    const subdomain = this.state.network?.chainId === 1 ? 'www' : 'testnets';

    return `https://${subdomain}.opensea.io/` + (CollectionConfig.openSeaSlug ? 'collection/' + CollectionConfig.openSeaSlug : null);
  }

  private async connectWallet(): Promise<void>
  {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' });

      this.initWallet();
    } catch (e) {
      this.setError(e);
    }
  }

  private async initWallet(): Promise<void>
  {
    const walletAccounts = await this.provider.listAccounts();
    
    this.setState(defaultState);

    if (walletAccounts.length === 0) {
      return;
    }
    
    this.setState({
      userAddress: walletAccounts[0],
      network: await this.provider.getNetwork(),
    });

    if (await this.provider.getCode(CollectionConfig.contractAddress!) === '0x') {
      this.setState({
        errorMessage: 'Could not find the contract, are you connected to the right chain?',
      });

      return;
    }

    this.contract = new ethers.Contract(
      CollectionConfig.contractAddress!,
      ContractAbi,
      this.provider.getSigner(),
    ) as NftContractType;

    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx: (await this.contract.maxMintAmountPerTx()).toNumber(),
      tokenPrice: await this.contract.cost(),
      isPaused: await this.contract.paused(),
      isWhitelistMintEnabled: await this.contract.whitelistMintEnabled(),
      isUserInWhitelist: Whitelist.contains(this.state.userAddress ?? ''),
      etherscanUrl: this.generateEtherscanUrl(),
    });
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void
  {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet();
    });

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }
}
