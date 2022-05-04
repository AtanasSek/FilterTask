const express = require('express');
const fs = require('fs');
const app = express();

//Namesto da citam od file, so require go povikuvam
let json = require("./json_collection/reviews.json")

// EJS View engine
app.set('view engine','ejs');
app.use(express.urlencoded({
    extended:true
}))

// Povisokiot score prv
function orderSortHighest(item1,item2){
    return item1.rating - item2.rating;
}

// Poniskiot score prv
function orderSortLowest(item1,item2){
    return item2.rating - item1.rating;
}

//Ponoviot datum prv
function sortByDateNewest(item1,item2){
    return item2.reviewCreatedOnTime - item1.reviewCreatedOnTime;
}

//Postariot datum prv
function sortByDateOldest(item1,item2){
    return item1.reviewCreatedOnTime - item2.reviewCreatedOnTime;
}

//Kombinacii od sorts od dve promenlivi , Rating i Date

//Lowest Score, Newest Date
function finalSortLowestNewest(item1,item2){
    return (orderSortLowest(item1,item2) || sortByDateNewest(item1,item2));
}

//Lowest Score , Oldest Date
function finalSortLowestOldest(item1,item2){
    return (orderSortLowest(item1,item2) || sortByDateOldest(item1,item2));
}

//Highest Score, Newest Date
function finalSortHighestNewest(item1,item2){
    return (orderSortHighest(item1,item2) || sortByDateNewest(item1,item2));
}

//Highest Score, Oldest Date
function finalSortHighestOldest(item1,item2){
    return (orderSortHighest(item1,item2) || sortByDateOldest(item1,item2));
}


// Dokolku Prioritize By Text == Yes
function sortPrioritizeText(array,order, orderDate){
    let part1 = []
    let part2 = []

    array.forEach(item => { // Podeli go orginalniot JSON vo dve posebni nizi, so text i bez text.
        if(item.reviewText == "")
            part1.push(item) // Niza bez text
        else
            part2.push(item) // Niza so text
    })


    // Se sortiraat dvete nizi posebno, so site kombinacii
    if(order == "Highest First" && orderDate == "Newest First"){
        part1.sort(finalSortLowestNewest)
        part2.sort(finalSortLowestNewest)
    }
    else if (order == "Highest First" && orderDate == "Oldest First"){
        part1.sort(finalSortLowestOldest)
        part2.sort(finalSortLowestOldest)
    }
    else if (order == "Lowest First" && orderDate == "Newest First"){
        part1.sort(finalSortHighestNewest)
        part2.sort(finalSortHighestNewest)
    }
    else if(order == "Lowest First" && orderDate == "Oldest First"){
        part1.sort(finalSortHighestOldest)
        part2.sort(finalSortHighestOldest)
    }

    let output = []

    // Vo nova niza , output , se vnesuvaat prvo objektite so Tekst, potoa bez
    part2.forEach(item => {
        output.push(item);
    })
    part1.forEach(item => {
        output.push(item);
    })

    //Promenlivata json, koja sto ja sodrzi orginalnata niza sega se zamenuva so novata
    json = output;

}

// Dokolku Prioritize By Text == No
function sortDontPrioritizeText(array , order, orderDate){

    //Se sortira edinstvenata niza
    //Highest score, Newest Date
    if(order == "Highest First" && orderDate == "Newest First"){
        array.sort(finalSortLowestNewest)
    }

    //Highest Score, Oldest Date
    else if (order == "Highest First" && orderDate == "Oldest First"){
        array.sort(finalSortLowestOldest)
    }

    //Lowest Score, Newest Date
    else if (order == "Lowest First" && orderDate == "Newest First"){
        array.sort(finalSortHighestNewest)
    }

    //Lowest Score, Oldest Date
    else if(order == "Lowest First" && orderDate == "Oldest First"){
        array.sort(finalSortHighestOldest)
    }

    json = array;
}

//Gi filtrira clenovite vo nizata koi sto imaat pomal rating od dozvoleniot, i potoa gi povikuva sort funkciite
function sortFilter(order,minrating,orderDate,prioritizeText){

    //Filter
    json = json.filter((item)=>{
        return item.rating >= minrating
    })

    //Sort
    if(prioritizeText == "Yes")
        sortPrioritizeText(json , order, orderDate)
    else
        sortDontPrioritizeText(json , order, orderDate)
}


//Ja servira pocetnata strana, odnosno formata.
app.get('/',(req,res) =>{
    res.render("index")
})


//Pri post, se prevzemaat vrednostite od formata.
app.post('/result',(req,res)=>{
    let order = req.body.orderRating
    let minrating = req.body.minRating
    let orderDate = req.body.orderDate
    let prioritizeText = req.body.prioritizeText

    //Se izvrsuva sort i filter i se promenuva file-wide promenlivata json so novata niza.
    sortFilter(order,minrating,orderDate,prioritizeText);

    // Novata niza se zapisuva vo output file
    let output = JSON.stringify(json,null,2)
    fs.writeFile("output.json", output , (err)=>{
        if (err) throw err;
    })

    // Dodatno se servira JSON-ot vo browserot, za brz pristap.
    res.json(json);

    res.end()
})

app.listen(3000)