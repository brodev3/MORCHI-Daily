# MORCHI-Daily
 
<p>
      <img src="https://i.ibb.co/3sHQCSp/av.jpg" >
</p>

<p >
   <img src="https://img.shields.io/badge/build-v_1.0-brightgreen?label=Version" alt="Version">
</p>


## About

This is a software tool for completing tasks, leveling up, collecting daily rewards, exchanging for the SUT token, swapping it to USDT, and transferring USDT to a designated return address.


## Features
- Operates on the Polygon network.
- Sends tokens to the withdrawal address.
- Verifies the presence of a specific NFT by ```tokenID```.
- Sends tokens to the output address if specified.
- Swaps tokens to USDT immediately after exchanging points to tokens.
- Allows leveling up to level 20.
- Randomly collects rewards throughout the day and during the first launch within the specified MAXTIME.

 ## Configuration
 Before starting, you need to configure the ```.env``` file. Open ```.env``` and set the following parameters:
 
    
    DECRYPT = 
    MESSAGE = "Sup bro"
    POLYGON_RPC_URL = "https://polygon-rpc.com"
    CONTRACT = "0xBAB028f7ac84EB4A90BC4eE5c3725437fFbA806e"
    NFTCONTRACT = "0xB48f53010Acbc0E24D3D12D892E2215879e6fD13"
    SUTCONTRACT = "0x57211299bC356319BA5CA36873eB06896173F8bC"
    USDTCONTRACT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    ROUTERCONTRACT = "0xAcc8e414ceeCF0BBF438f6c4B7417Ca59dcF7E47"
    GMTCONTRACT = "0x714DB550b574b3E927af3D93E26127D15721D4C2"

    
Explanation of parameters:
- **DECRYPT**: Used for encrypted text. If not needed, leave it empty. If needed, set to ```1```.
- **MESSAGE**: A phrase for decryption.
- **POLYGON_RPC_URL**: The RPC URL of the token's network.
- **CONTRACT**: The MORCHI game contract address.
- **NFTCONTRACT**: The MORCHI NFT contract address.
- **USDTCONTRACT**: USDT contract address.
- **ROUTERCONTRACT**: The DOOAR contract address.
- **GMTCONTRACT**: GMT contract address.
- **MAXTIME**: The maximum time (in milliseconds) that will be randomly assigned to delay the execution of token transfers from each wallet. All accounts will be triggered within this random delay. For example, if MAXTIME is set to 5000, the transfer can occur anytime between 1 second and 5 seconds (1000-5000 milliseconds).

 ## Wallet Configuration
Fill out the ```w.csv``` file with the wallets to be used for token transfers. The first row with the value ```1``` is a header and must not be removed. Below the header, insert data in the format (if you do not need to send, then leave an empty value after the delimiter ```;``):

    privateKey;tokenID;withdrawAddress

 ## How to Start

1. Node JS
2. Clone the repository to your disk
3. Configure ```.env``` with the appropriate parameters
4. Add wallet information to ```w.csv```
5. Launch the console (for example, Windows PowerShell)
6. Specify the working directory where you have uploaded the repository in the console using the CD command
    ```
    cd C:\Program Files\brothers
    ```
7. Install packages
   
    ```
    npm install
    ```
8. Run the software, and it will transfer tokens from the specified wallets to the respective addresses. All accounts will start transferring after a random delay, determined between 1 second and the value specified in MAXTIME.
    ```
    node index
    ```





## License

Project **brodev3**/MORCHI-Daily distributed under the MIT license.
