// node <script.js> memorization.sqlite files/sounds/

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const exec = require('child_process');
const wanakana = require('wanakana');
var sqlite = require("better-sqlite3");
var db = new sqlite(process.argv[2]);

var soundSource = process.argv[3];

const deckName = "verbs";
var decksDir = path.join(__dirname, "..", "decks");
var audioDir = path.join(decksDir, "audio", deckName);
if (!fs.existsSync(audioDir)){
    fs.mkdirSync(audioDir);
}

var out = {
    "name" : deckName,
    "version" : 1,
    "cards" : []
};
var rows = db.prepare("SELECT id, long_hiragana, short_hiragana, short_kanji, english, short_voice_filename FROM 'words' WHERE card_id = 2").all();

for (let wordId = 0; wordId < rows.length; wordId++) {
    var row = rows[wordId];

    inflect_rows = db.prepare("SELECT * FROM 'inflect' WHERE word_id = " + row.id).all();
    for (let i = 0; i < inflect_rows.length; i++) {
        inflect_row = inflect_rows[i];
        var card = {
            "kana" : "",
            "translation" : "",
            "stem" : row.short_kanji ? row.short_kanji : row.short_hiragana,
            "type" : ""
        }

        var audioFile = path.join(audioDir, inflect_row.voice_filename);
        var sourceFile = soundSource + inflect_row.voice_filename
        if (fs.existsSync(sourceFile)) {
            card.sound = inflect_row.voice_filename;
            if (!fs.existsSync(audioFile)){
                var copy_sound = "cp "+ sourceFile + " " + audioFile;
                exec.execSync(copy_sound);
            }
        }


        card.kana = inflect_row.word;
        if (card.kana.includes("☆")) {
            card.kana = card.kana.replace('☆', '');
        }

        if (card.kana == "―") { continue; }

        if (inflect_row.inflect == 1 && inflect_row.is_long == 1) {
            card.type = "present affirmative polite";
            card.translation = row.english + " (polite)";
        } else if (inflect_row.inflect == 2 && inflect_row.is_long == 1) {
            card.type = "present negative polite";
            card.translation = "not " + row.english + " (polite)";
        } else if (inflect_row.inflect == 3 && inflect_row.is_long == 1) {
            card.type = "past affirmative polite";
            card.translation = "was " + row.english + " (polite)";
        } else if (inflect_row.inflect == 4 && inflect_row.is_long == 1) {
            card.type = "past negative polite";
            card.translation = "was not " + row.english + " (polite)";
        } else if (inflect_row.inflect == 5 && inflect_row.is_long == 1) {
            card.type = "volitional polite";
            card.translation = "let's " + row.english + " (polite)";
        } else if (inflect_row.inflect == 1 && inflect_row.is_long == 2) {
            card.type = "present affirmative casual";
            card.translation = row.english;
        } else if (inflect_row.inflect == 2 && inflect_row.is_long == 2) {
            card.type = "present negative casual";
            card.translation = "not " + row.english;
        } else if (inflect_row.inflect == 3 && inflect_row.is_long == 2) {
            card.type = "past affirmative casual";
            card.translation = "was " + row.english;
        } else if (inflect_row.inflect == 4 && inflect_row.is_long == 2) {
            card.type = "past negative casual";
            card.translation = "was not " + row.english;
        } else if (inflect_row.inflect == 5 && inflect_row.is_long == 2) {
            card.type = "volitional casual";
            card.translation = "let's " + row.english;
        } else if (inflect_row.inflect == 6 && inflect_row.is_long == 2) {
            card.type = "ば形";
            card.translation = "if " + row.english;
        } else if (inflect_row.inflect == 7 && inflect_row.is_long == 2) {
            card.type = "なければ形";
            card.translation = "if not " + row.english;
        } else {
            assert(false);
        }
        out.cards.push(card);
    }

    potential_rows = db.prepare("SELECT * FROM 'potential_form' WHERE is_long = 2 AND word_id = " + row.id).all();
    for (let i = 0; i < potential_rows.length; i++) {
        potential_row = potential_rows[i];
        var card = {
            "kana" : "",
            "translation" : "",
            "stem" : row.short_kanji ? row.short_kanji : row.short_hiragana,
            "type" : ""
        }

        var audioFile = path.join(audioDir, potential_row.voice_filename);
        var sourceFile = soundSource + potential_row.voice_filename
        if (fs.existsSync(sourceFile)) {
            card.sound = potential_row.voice_filename;
            if (!fs.existsSync(audioFile)){
                var copy_sound = "cp "+ sourceFile + " " + audioFile;
                exec.execSync(copy_sound);
            }
        }

        card.kana = potential_row.word;
        if (card.kana.includes("☆")) {
            card.kana = card.kana.replace('☆', '');
        }

        if (card.kana == "―") { continue; }

        if (potential_row.potential == 1) {
            card.type = "present affirmative 可能形";
            card.translation = "can " + row.english;
        } else if (potential_row.potential == 2) {
            card.type = "present negative 可能形";
            card.translation = "can't " + row.english;
        } else if (potential_row.potential == 3) {
            card.type = "past affirmative 可能形";
            card.translation = "could " + row.english;
        } else if (potential_row.potential == 4) {
            card.type = "past negative 可能形";
            card.translation = "could not " + row.english;
        } else if (potential_row.potential == 5) {
            card.type = "if 可能形";
            card.translation = "if can " + row.english;
        } else if (potential_row.potential == 6) {
            card.type = "if not 可能形";
            card.translation = "if can not " + row.english;
        } else {
            assert(false);
        }
        out.cards.push(card);
    }

    tekei_rows = db.prepare("SELECT * FROM 'tekei' WHERE is_long = 2 AND word_id = " + row.id).all();
    for (let i = 0; i < tekei_rows.length; i++) {
        tekei_row = tekei_rows[i];
        var card = {
            "kana" : "",
            "translation" : "",
            "stem" : row.short_kanji ? row.short_kanji : row.short_hiragana,
            "type" : ""
        }

        var audioFile = path.join(audioDir, tekei_row.voice_filename);
        var sourceFile = soundSource + tekei_row.voice_filename
        if (fs.existsSync(sourceFile)) {
            card.sound = tekei_row.voice_filename;
            if (!fs.existsSync(audioFile)){
                var copy_sound = "cp "+ sourceFile + " " + audioFile;
                exec.execSync(copy_sound);
            }
        }

        card.kana = tekei_row.word;
        if (card.kana.includes("☆")) {
            card.kana = card.kana.replace('☆', '');
        }

        if (card.kana == "―") { continue; }

        if (tekei_row.tekei == 1) {
            continue;
        } else if (tekei_row.tekei == 2) {
            card.type = "て形";
            card.translation = row.english + " and";
        } else if (tekei_row.tekei == 3) {
            card.type = "ないで形";
            card.translation = "not " + row.english + " and";
        } else if (tekei_row.tekei == 4) {
            card.type = "受身形";
            card.translation = row.english;
        } else if (tekei_row.tekei == 5) {
            card.type = "使役形";
            card.translation = row.english;
        } else if (tekei_row.tekei == 6) {
            card.type = "使役受身形";
            card.translation = row.english;
        } else if (tekei_row.tekei == 7) {
            card.type = "たい形";
            card.translation = "want " + row.english;
        } else if (tekei_row.tekei == 8) {
            card.type = "たくない形";
            card.translation = "don't want " + row.english;
        } else {
            assert(false);
        }
        out.cards.push(card);
    }
}

fs.writeFileSync(path.join(decksDir, deckName + ".json"), JSON.stringify(out));

db.close();