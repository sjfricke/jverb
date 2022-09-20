// Current state of displayed values and where to mark correct
var gDisplay = {
    // was going to do a ring buffer, but running local all things should load fast enough
    currentCard : {},
    nextCard : {},

    dom : {
        kanji : {},
        kana : {},
        translation : {},
        formType : {},
        input : {},
    },

    // For smart detect
    nextIsKatakana : false,
    nextIsN : false,
    // for showing furigana on screen
    correctKanaIndex : 0,
    kanjiStartIndex : [],

    tokens : {}, // detailed

    matched : false,
}

function resetGlobalDisplay() {
    gDisplay.correctKanaIndex = 0;
    gDisplay.kanjiStartIndex = [];
    gDisplay.tokens = {};
}

function setNextCorrect(input) {
    gDisplay.nextIsKatakana = wanakana.isKatakana(input);
    gDisplay.nextIsN = input == "ん" || input == "ン";
}

function playSound() {
    // If audio is playing, restart it, otherwise play it
    var audio = gDisplay.currentCard.audio;
    if (audio) {
        if (!audio.ended) {
            audio.load(); // pauses and resets it
        }
        audio.play();
    }
}

function setVisibility() {
    gDisplay.dom.kanji.style.visibility  = (inputSettings.listenMode) ? "hidden" : "visible";

    gDisplay.dom.kana.style.visibility  = (document.getElementById("kana").checked) ? "visible" : "hidden";
    if (document.getElementById("formType")) {
        document.getElementById("formType").style.visibility  = (document.getElementById("showType").checked) ? "visible" : "hidden";
    }
}

function displayCard() {
    // make each char in kanji html capable to being highlighted
    var kanjiHtml = gDisplay.currentCard.stem;
    kanjiHtml += "<br><span id=\"formType\">";
    kanjiHtml += gDisplay.currentCard.type;
    kanjiHtml += "</span>";

    // highlight keywords
    kanjiHtml = kanjiHtml.replace("polite", "<span style=\"color:fuchsia\">polite</span>");
    kanjiHtml = kanjiHtml.replace("affirmative", "<span style=\"color:green\">affirmative</span>");
    kanjiHtml = kanjiHtml.replace("negative", "<span style=\"color:red\">negative</span>");
    kanjiHtml = kanjiHtml.replace("present", "<span style=\"color:dodgerblue\">present</span>");
    kanjiHtml = kanjiHtml.replace("past", "<span style=\"color:goldenrod\">past</span>");

    // Reset values for display
    resetGlobalDisplay();

    gDisplay.dom.kanji.innerHTML = kanjiHtml;
    gDisplay.dom.kana.innerHTML = gDisplay.currentCard.kana;
    gDisplay.dom.translation.innerHTML = gDisplay.currentCard.translation;

    // display right away controlled by setting
    setVisibility();

    // need to set first letter for smart detect to start right away
    setNextCorrect(gDisplay.currentCard.kana[0]);

    if (inputSettings.playSound) {
        playSound();
    }
}

// Get the next card
function getNextCard() {
    if (gDisplay.nextCard == undefined) {
        alert("Out of cards, time to reload");
    }

    $.get("/cards/1", function(data) {
        // pause and delete old audio if there
        if (gDisplay.currentCard.audio) {
            gDisplay.currentCard.audio.pause();
            delete gDisplay.currentCard.audio;
        }

        gDisplay.currentCard = gDisplay.nextCard;
        if (data.length == 0) {
            console.log("Ran out of cards");
            gDisplay.nextCard = undefined;
        } else {
            gDisplay.nextCard = data[0];
            gDisplay.nextCard.audio = (gDisplay.nextCard.sound) ? new Audio("sound/" + gDisplay.nextCard.sound) : undefined;
        }

        clearInputDisplay();
        displayCard();
    })
}

// Check if result is correct
function compareInput() {
    var answer = gDisplay.currentCard.kana;
    var input = gDisplay.dom.input.innerText;
    if (input.length == 0) {
        // fall through for visibility
    } else if (input == answer) {
        // full match
        gDisplay.matched = true;
        if (inputSettings.listenMode) {
            // TODO - まった will not work... just make a function to set these
            // save trouble with getting this to fall through and just set the last character as correct
            gDisplay.dom.kanji.children[gDisplay.dom.kanji.children.length - 3].classList.add("correct");
            gDisplay.dom.kanji.children[gDisplay.dom.kanji.children.length - 3].classList.remove("wrong");
            // inject 'tab' key to display and have user hit 'enter'
            document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':9}));
        } else {
            getNextCard();
        }
    }

    // Set per character after everything
    if (inputSettings.listenMode) {
        for (var i = 0; i < gDisplay.dom.kanji.children.length; i++) {
            let character = gDisplay.dom.kanji.children[i];
            if (character.id == "furigana") {
                continue;
            }

            // Makes it harder to not see the next 'wrong' labeled items until typed correctly
            let showWrong = character.classList.contains("wrong") && inputSettings.showWrong;

            if (character.classList.contains("correct") || showWrong || gDisplay.dom.kana.style.visibility == "visible") {
                character.style.visibility = "visible";
            } else {
                character.style.visibility = "hidden";
            }
        }
    }
}

// Used to update the CSS to match desired layout
//
// @param vertical Set as vertical or else horizontal
function setDisplayLayout() {
    if (inputSettings.vertical) {
        gDisplay.dom.kanji.classList.remove("textKanjiHorizontal");
        gDisplay.dom.kana.classList.remove("textKanaHorizontal");
        gDisplay.dom.translation.classList.remove("textTranslationHorizontal");
        gDisplay.dom.input.classList.remove("inputDisplayHorizontal");

        gDisplay.dom.kanji.classList.add("textKanjiVertical");
        gDisplay.dom.kana.classList.add("textKanaVertical");
        gDisplay.dom.translation.classList.add("textTranslationVertical");
        gDisplay.dom.input.classList.add("inputDisplayVertical");

        document.getElementById("textDisplay").style.display = "flex";
    } else {
        gDisplay.dom.kanji.classList.remove("textKanjiVertical");
        gDisplay.dom.kana.classList.remove("textKanaVertical");
        gDisplay.dom.translation.classList.remove("textTranslationVertical");
        gDisplay.dom.input.classList.remove("inputDisplayVertical");

        gDisplay.dom.kanji.classList.add("textKanjiHorizontal");
        gDisplay.dom.kana.classList.add("textKanaHorizontal");
        gDisplay.dom.translation.classList.add("textTranslationHorizontal");
        gDisplay.dom.input.classList.add("inputDisplayHorizontal");

        document.getElementById("textDisplay").style.display = "block";
    }

    setVisibility();
}

// Called after deck is selected or debug mode to get main display up
function setupMainType() {
    // get first card and back buffer
    $.get("/cards/2", function(data) {
        gDisplay.currentCard = data[0];
        gDisplay.nextCard = data[1];

        // get Audio - will be undefined if no sound file
        gDisplay.currentCard.audio = (gDisplay.currentCard.sound) ? new Audio("sound/" + gDisplay.currentCard.sound) : undefined;
        gDisplay.nextCard.audio = (gDisplay.nextCard.sound) ? new Audio("sound/" + gDisplay.nextCard.sound) : undefined;

        // prevent requery each time as dom elements never leave
        gDisplay.dom.kanji = document.getElementById("textKanji");
        gDisplay.dom.kana = document.getElementById("textKana");
        gDisplay.dom.translation = document.getElementById("textTranslation");
        gDisplay.dom.input = document.getElementById("inputDisplay");

        // Default layout
        setDisplayLayout();

        // Swap deck select with main typing screen
        var mainType = document.getElementById("mainType");
        mainType.style.visibility = "visible";
        document.getElementById("deckSelect").remove();

        // Turn whole screen into a keylogger
        document.addEventListener('keydown', mainTypeKeydown);
        document.addEventListener('keyup', mainTypeKeyup);

        displayCard();
    });
}

$(document).ready(function(){
    console.debug("Document loaded");

    if (DEBUG) {
        // Bypass selection processed
        setupMainType();
        return;
    }

    $.get("/decks", function(data) {
        var deckList = document.getElementById("deckList");
        for (var i = 0; i < data.decks.length; i++) {
            const deck = data.decks[i];
            var newListItem = document.createElement("li");
            newListItem.innerHTML = "<button class=\"deckOnClick\" id=\"" + deck.name + "\">select</button> "
                                    + deck.name + " (" + deck.cardCount + " cards)"
            deckList.appendChild(newListItem);
        }

        // Apply jquery events
        $(".deckOnClick").on("click", deckOnClick);
    });
});
