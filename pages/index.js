import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { WHITELIST_CONTRACT_ADDRESS, ABI } from "../constants";

export default function Home() {

  const [numberOfWhitelistedAddresses, setNumberOfWhitelistedAddresses] = useState(0);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [hasConnectedAccountJoinedWhitelist, setHasConnectedAccountJoinedWhitelist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);

  async function checkIfMetamaskIsInstalled() {
    const { ethereum } = window;
    if (!ethereum) {
      setIsMetamaskInstalled(false);
      alert("install metamask");
    } else {
      setIsMetamaskInstalled(true);
    }
  }

  async function checkIfMetamaskConnected() {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log(accounts);
      if (accounts.length !== 0) {
        setConnectedAddress(accounts[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getProviderOrSigner(needSigner = false) {
    const { ethereum } = window;
    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    const network = await web3Provider.getNetwork();
    if (network.chainId !== 4) {
      alert("please connect to rinkeby");
    } else {
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    }
  }

  async function connectWallet() {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("inside connect wallet", accounts);

      if (accounts.length !== 0) {
        setConnectedAddress(accounts[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function checkIfAddressIsWhitelisted() {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new ethers.Contract(WHITELIST_CONTRACT_ADDRESS, ABI, signer);
      const signerAddress = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.isAddressWhitelisted(signerAddress);
      console.log(_joinedWhitelist);
      setHasConnectedAccountJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.log(error);
    }
  }

  async function getWhitelistedAddressesCount() {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new ethers.Contract(WHITELIST_CONTRACT_ADDRESS, ABI, provider);
      const count = await whitelistContract.numberOfWhitelistedAddresses();
      console.log(count);
      setNumberOfWhitelistedAddresses(count);
    } catch (error) {
      console.log(error);
    }
  }

  async function addAddressToWhitelist() {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new ethers.Contract(WHITELIST_CONTRACT_ADDRESS, ABI, signer);
      setIsLoading(true);
      const tx = await whitelistContract.whitelistAddress();
      await tx.wait();
      setIsLoading(false);
      await getWhitelistedAddressesCount();
      setHasConnectedAccountJoinedWhitelist(true);

    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    checkIfMetamaskIsInstalled();
  }, []);

  useEffect(() => {
    if (isMetamaskInstalled) {
      checkIfMetamaskConnected();
    }
  }, [isMetamaskInstalled]);

  useEffect( () => {
    if (connectedAddress !== "") {
      console.log("inside useEffect");
      checkIfAddressIsWhitelisted();
      getWhitelistedAddressesCount();
    }
  }, [connectedAddress])

  const renderButton = () => {
    if (connectedAddress !== "") {
      if (hasConnectedAccountJoinedWhitelist) {
        return (
          <div>
            Thanks for joining whitelist
          </div>
        )
      } else if (isLoading) {
        return (
          <div>
            Loading......
          </div>
        )
      }
      else {
        return (
          <button className={styles.button} onClick={addAddressToWhitelist} >
            join the whitelist
          </button>
        )
      }

    } else {
      return (
        <button className={styles.button} onClick={connectWallet} >connect wallet</button>
      )
    }
  }
  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelistedAddresses} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
