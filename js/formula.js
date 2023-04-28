for (let i = 0; i < allCells.length; i++) {
 allCells[i].addEventListener("blur", function() {
        let data = allCells[i].innerText; //get value from cell
        let address = addressInput.value; //get address from address bar
        let rid = allCells[i].getAttribute("rid"); //row id
        let cid = allCells[i].getAttribute("cid"); //col id
        let cellObject = sheetDB[rid][cid];


        if (cellObject.value == data) {
            return;
        }

        if (cellObject.formula) {
            removeFormula(cellObject, address);
            formulaBar.value = "";
        }

        cellObject.value = data; //update value in data base(sheetDB)

        updateChildren(cellObject);

        allCells[i].style.textAlign = "right";
        cellObject.hAlign = "right";
    })
}

formulaBar.addEventListener("keydown", function(e) {
    if (e.key == "Enter" && formulaBar.value) {
        let currentFormula = formulaBar.value;
        let address = addressInput.value;
        let { rid, cid } = getRIDCIDfromAddress(address);
        let uiCellElement = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
        let cellObject = sheetDB[rid][cid];
 let prevFormula = cellObject.formula;

        if (prevFormula == currentFormula) {
            return;
        }

        let isCycle = checkCycle(address, currentFormula);
        if (isCycle == true) {
            console.log("Cycle Detected");
            return;
        }
        console.log("Cycle Not Detected");
        if (currentFormula != cellObject.formula) {
            removeFormula(cellObject, address);
        }

        let value = evaluateFormula(currentFormula);

        setCell(value, currentFormula);
 setParentCHArray(currentFormula, address);

        updateChildren(cellObject);

        uiCellElement.style.textAlign = "right";
        cellObject.hAlign = "right";
    }
})

function evaluateFormula(formula) {
    let formulaTokens = formula.split(" "); 
    for (let i = 0; i < formulaTokens.length; i++) {
        let ascii = formulaTokens[i].charCodeAt(0);
        if (ascii >= 65 && ascii <= 90) {
            let { rid, cid } = getRIDCIDfromAddress(formulaTokens[i]);
            let value = sheetDB[rid][cid].value;
            formulaTokens[i] = value;         }
    }
    let evaluatedFormula = formulaTokens.join(" ");
    let solvingValue = eval(evaluatedFormula);
    return solvingValue;
}
function setCell(value, formula) {
    let uicellElem = findUICellElement();
    uicellElem.innerText = value;

    let { rid, cid } = getRIDCIDfromAddress(addressInput.value);
    sheetDB[rid][cid].value = value;
    sheetDB[rid][cid].formula = formula;
}

function setParentCHArray(formula, chAddress) {
    let formulaTokens = formula.split(" ");
    for (let i = 0; i < formulaTokens.length; i++) {
        let ascii = formulaTokens[i].charCodeAt(0);
        // ascii valid or not
        if (ascii >= 65 && ascii <= 90) {
            let { rid, cid } = getRIDCIDfromAddress(formulaTokens[i]);
            let parentObj = sheetDB[rid][cid]; //A1
            parentObj.children.push(chAddress); //A1.children.push(B1)-> A1=children:[B1]
        }
    }
}

function updateChildren(cellObject) {
    let children = cellObject.children; // get children array from sheetDb
    for (let i = 0; i < children.length; i++) {
        // children name
        let chAddress = children[i];
        let { rid, cid } = getRIDCIDfromAddress(chAddress);
        // 2d array
        let childObj = sheetDB[rid][cid];
        // get formula of children
        let chFormula = childObj.formula;
        let newValue = evaluateFormula(chFormula); //find value
        SetChildrenCell(newValue, chFormula, rid, cid);
        updateChildren(childObj);
    }
}

function SetChildrenCell(value, formula, rid, cid) {
    // let uicellElem = findUICellElement();
    // db update 
    let uiCellElement = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
    uiCellElement.innerText = value; //value update in ui
    sheetDB[rid][cid].value = value; //value update in Data base
    sheetDB[rid][cid].formula = formula; //formula update in Data base
}

function removeFormula(cellObject, myName) {
    //formula -> parent -> children remove yourself
    let formula = cellObject.formula; // ( A1 + A2 )
    let formulaTokens = formula.split(" "); // split on the base of spacing (" ") -> [(,A1,+,A2,)]
    for (let i = 0; i < formulaTokens.length; i++) {
        let ascii = formulaTokens[i].charCodeAt(0);
        if (ascii >= 65 && ascii <= 90) {
            let { rid, cid } = getRIDCIDfromAddress(formulaTokens[i]); // get row id & col id
            let parentObj = sheetDB[rid][cid]; // A1
            let idx = parentObj.children.indexOf(myName); // A1 -> children : [B1]
            parentObj.children.splice(idx, 1); //remove children B1 from parent A1
        }
    }
    cellObject.formula = ""; // remove formula ( A1 + A2 )
}

function checkCycle(address, newFormula) {
    let formulaTokens = newFormula.split(" ");

    let { rid, cid } = getRIDCIDfromAddress(address);
    let cellObject = sheetDB[rid][cid];
    let myChildren = cellObject.children;

    for (let i = 0; i < myChildren.length; i++) {
        let childAddress = myChildren[i];
        for (let i = 0; i < formulaTokens.length; i++) {
            let firstCharofToken = formulaTokens[i].charCodeAt(0);
            if (firstCharofToken >= 65 && firstCharofToken <= 90) {
                let parentAddress = formulaTokens[i]; // A1

                if (parentAddress == childAddress) {
                    alert("Cycle Detected!!");
                    return true;
                }
            }
        }

        return checkCycle(childAddress, newFormula);
    }
    return false;
}

function findUICellElement() {
    let address = addressInput.value; // get input from current address bar -> like address 'B1'
    let ricidObj = getRIDCIDfromAddress(address); // { rid: 0, cid: 1}
    let rid = ricidObj.rid; //0
    let cid = ricidObj.cid; //1
    let uiCellElement = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`) //B1
    return uiCellElement; //B1
}
// Address (string)-> rid /cid
function getRIDCIDfromAddress(address) {
    let cid = Number(address.charCodeAt(0)) - 65; //Number(B=66)
    let rid = Number(address.slice(1)) - 1; //1 - 1
    return { "rid": rid, "cid": cid }; // rid = 0 , cid = 1 -> (0,1)
}