var web3;
var browserType;
var fromAddress;
var accounts;
var contractAddress = "0x2ff7d47d6940240abdec233d452c705e586a04c4";
var contract;
var stage;
var bidderId;
var lotteryBalance;
var contractOwner;
var winners = [null,null,null]
var items = [null,null,null]

window.addEventListener('load', async ()=>{
    initWeb3();

    toggleAppLoading('loading')
    await getAccountsAndFromAddress()
    setAccountsChnagedCallback()
    initConctract();
    await getContractOwner()
    await getStage()
    await getBidderId();
    await getLotteryBalance()
    await getItems()

    setItemsData()
    setAddresses()
    setLotteryBalance()
    showAdminComponents();

    bid()
    reveal()
    amIwinner()
    restart()
    declareWinners()
    withdraw()

    toggleAppLoading('idle')

})


function initWeb3(){
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        browserType = 'modern';
    }else{
        web3 = new Web3(web3.currentProvider);
        browserType = 'legacy';
    }
}

async function getAccountsAndFromAddress(){
    if(browserType=='modern'){
        accounts =  await window.ethereum.request({ method:'eth_requestAccounts' });
    }else if(browserType=='legacy'){
        accounts =  await web3.eth.getAccounts();
    }
}

function setAccountsChnagedCallback(){
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts_) => {
            web3.eth.getAccounts(async (error, accounts__) => {
                if (error) {
                    showToaster("danger","There awas an error chaning the account.")
                    return;
                } else {
                    toggleAppLoading('loading')
                    accounts = accounts__;
                    setAddresses()
                    await getBidderId()
                    await getLotteryBalance()
                    await getItems()
                    await getStage()
                    setItemsData()
                    showAdminComponents();
                    toggleAppLoading('idle')
                }
            });
        });
    }
}

function initConctract(){
    contract = new web3.eth.Contract(abi, contractAddress);
}

async function getItems(){
    items[0] =  await contract.methods.getItemDetails(0).call()
    items[1] =  await contract.methods.getItemDetails(1).call()
    items[2] =  await contract.methods.getItemDetails(2).call()
    console.log(items)
}

async function getContractOwner(){
    contractOwner = await contract.methods.beneficiary().call() 
}

async function getLotteryBalance(){
    lotteryBalance = (await contract.methods.lotteryBalance().call()) / 1000000000000000000 
}

async function getBidderId(){
    bidderId = await contract.methods.getBidderIdByAddress(accounts[0]).call();
}

async function getStage(){
    stage = await contract.methods.stage().call();
    console.log(stage)
    if(stage==1){
        jQuery("#item1bid").attr("disabled","true")
        jQuery("#item2bid").attr("disabled","true")
        jQuery("#item3bid").attr("disabled","true")
    }else{
        jQuery("#item1bid").removeAttr("disabled")
        jQuery("#item2bid").removeAttr("disabled")
        jQuery("#item3bid").removeAttr("disabled")
    }
}

async function getWinners(){
    winners[0] = await contract.methods.winners(0).call();
    winners[1] = await contract.methods.winners(1).call();
    winners[2] = await contract.methods.winners(2).call();
}

function toggleAppLoading(mode){
    if(mode=='loading'){
        jQuery("#spinner").css("display",'block');
        jQuery("#spinnerText").css("display",'block');
        jQuery("#mainContent").css("display",'none');
    }else if(mode=='idle'){
        jQuery("#spinner").css("display",'none');
        jQuery("#spinnerText").css("display",'none');
        jQuery("#mainContent").css("display",'grid');
    }else{
        return 
    }
}

function setItemsData(){
    jQuery("#item1image").attr('src',items[0][3])
    jQuery("#item1title").html(items[0][2].toUpperCase())
    jQuery("#item1tokens").html("Current item tokens for current user: " + items[0][1].filter(e=>Number(e)==bidderId).length)

    jQuery("#item2image").attr('src',items[1][3])
    jQuery("#item2title").html(items[1][2].toUpperCase())
    jQuery("#item2tokens").html("Current item tokens for current user: " + items[1][1].filter(e=>e==bidderId).length)

    jQuery("#item3image").attr('src',items[2][3])
    jQuery("#item3title").html(items[2][2].toUpperCase())
    jQuery("#item3tokens").html("Current item tokens for current user: " + items[2][1].filter(e=>e==bidderId).length)
}

function setAddresses(){
    jQuery("#currentAccount").val(accounts[0])
    jQuery("#ownerAccount").val(contractOwner)
}


function setLotteryBalance(){
    jQuery("#lotteryBalance").html(lotteryBalance + " ETH")
}

function bid(){
    jQuery(".bid").click(async function(){
        toggleAppLoading('loading')
        const itemToBid = Number(jQuery(this).attr('id').replace("item",'').replace("bid",''))-1;
        const tokensToBid = 1;

        try{
            await contract.methods.bid(itemToBid,tokensToBid).send({from:accounts[0],gas:3000000,value:10000000000000000})
        }catch(error){
            toggleAppLoading('idle')
            showToaster('danger',"There was an error bidding.")
            return
        }
        await getBidderId()
        await getLotteryBalance()
        await getItems()
        setItemsData()
        toggleAppLoading('idle')
        showToaster('success',"You bid has been placed.")

    })
}

function reveal(){

    jQuery("#reveal").click(()=>{
        jQuery("#itemTokensDataContainer").css("display","block");
        jQuery("#itemTokensData").html(items.map(item=>{
            return item[2].toUpperCase() + ": " + item[1].length + " tokens"
        }).join(",  "))
    })

    jQuery("#revealClose").click(()=>{
        jQuery("#itemTokensDataContainer").css("display","none"); 
    })

}


function amIwinner(){
    jQuery("#amIwinner").click(async ()=>{
        if(stage==0){
            showToaster('danger','The lottery has not ended yet.')
            return;
        }

    
        await getWinners()
        console.log(winners)
        var html = []
        if(compareAddresses(winners[0],accounts[0])){
            html.push(items[0][2].toUpperCase())
        }
        if(compareAddresses(winners[1],accounts[0])){
            html.push(items[1][2].toUpperCase())
        }
        if(compareAddresses(winners[2],accounts[0])){
            html.push(items[2][2].toUpperCase())
        }

        console.log(html)
        jQuery("#amIwinnerData").html("You win the following items: " + html.join(", "))
        jQuery("#amIwinnerContainer").css("display","block");
    })

    jQuery("#amIwinnerClose").click(()=>{
        jQuery("#amIwinnerContainer").css("display","none"); 
    })

}

function declareWinners(){
    jQuery("#declareWinners").click(async ()=>{
        toggleAppLoading('loading')

        try{
            await contract.methods.revealWinners().send({from:accounts[0],gas:3000000})
        }catch(error){
            toggleAppLoading('idle')
            showToaster('danger',"There was an error declaring the winner.")
            return
        }
        
        await getStage();
  
        toggleAppLoading('idle')
        showToaster('success',"The lottery has been ended successfully.")
    })
}

function restart(){
    jQuery("#restart").click(async ()=>{
        if(stage==0){
            showToaster('danger','The lottery has not ended yet.')
            return;
        }

        toggleAppLoading('loading')

        try{
            await contract.methods.restart().send({from:accounts[0],gas:3000000})
        }catch(error){
            toggleAppLoading('idle')
            showToaster('danger',"There was an error restarting the lottery")
            return
        }
        
        await getContractOwner()
        await getStage()
        await getBidderId();
        await getLotteryBalance()
        await getItems()
    
        setItemsData()
        setAddresses()
        setLotteryBalance()
        showAdminComponents();    
        
        toggleAppLoading('idle')
        showToaster('success',"The lottery has been restarted successfully.")
    })
}

function withdraw(){
    jQuery("#withdraw").click(async ()=>{
        if(stage==0){
            showToaster('danger','The lottery has not ended yet.')
            return;
        }
        toggleAppLoading('loading')

        try{
            await contract.methods.withdraw().send({from:accounts[0],gas:3000000})
        }catch(error){
            toggleAppLoading('idle')
            showToaster('danger',"There was an error restarting the lottery")
            return
        }

        await getContractOwner()
        await getStage()
        await getBidderId();
        await getLotteryBalance()
        await getItems()
    
        setItemsData()
        setAddresses()
        setLotteryBalance()
        showAdminComponents(); 
        
        toggleAppLoading('idle')
        showToaster('success',"The contract balance has been withdrawn.")
    })
}

function showToaster(mode,text){
    jQuery("#toaster").removeClass();
    jQuery("#toaster").addClass('alert');
    jQuery("#toaster").addClass('alert-' + mode);
    jQuery("#toaster").css('display','block');
    jQuery("#toaster").html(text);

    setTimeout(()=>{
        jQuery("#toaster").css('display','none');
    },2000)
}


function showAdminComponents(){

    if(compareAddresses(accounts[0],contractOwner)){
        jQuery("#adminButtons").css("display","block");
        jQuery("#amIwinner").css("display","none");
        jQuery("#item1bid").css("display","none")
        jQuery("#item2bid").css("display","none")
        jQuery("#item3bid").css("display","none")
    }else{
        jQuery("#adminButtons").css("display","none");
        jQuery("#amIwinner").css("display","block");
        jQuery("#item1bid").css("display","block")
        jQuery("#item2bid").css("display","block")
        jQuery("#item3bid").css("display","block")
    }
}

function compareAddresses(addr1,addr2){
    return addr1.toUpperCase() == addr2.toUpperCase()
}
