module.exports = class SetGame {
  constructor() {
    this.deck = SetGame.generateDeck();
    this.board = this.deck.splice(0, 12);
    this.gameId = 1;
    this.boardId = 1;
  }

  static getShapes() {
    return ['DIAMOND', 'OVAL', 'SQUIGGLE'];
  }

  static getColors() {
    return ['GREEN', 'PURPLE', 'RED'];
  }

  static getCounts() {
    return ['ONE', 'TWO', 'THREE'];
  }

  static getFilling() {
    return ['EMPTY', 'STRIPED', 'FILLED'];
  }

  static generateDeck() {
    const deck = [];
    for (const shape of SetGame.getShapes()) {
      for (const color of SetGame.getColors()) {
        for (const count of SetGame.getCounts()) {
          for (const filling of SetGame.getFilling()) {
            deck.push({
              shape, color, count, filling,
            });
          }
        }
      }
    }

    // shuffle
    for (let i = 0; i < deck.length; i += 1) {
      const randIndex = Math.floor(Math.random() * deck.length);
      const temp = JSON.parse(JSON.stringify(deck[randIndex]));
      Object.assign(deck[randIndex], deck[i]);
      Object.assign(deck[i], temp);
    }

    // for debug, shrink the deck
    // deck.splice(15, 100);

    return deck;
  }

  static areThreeThingsAllSameOrDifferent(thingArray) {
    // return all different or all same
    return ((thingArray[0] !== thingArray[1] &&
      thingArray[1] !== thingArray[2] &&
      thingArray[0] !== thingArray[2]) ||
    (thingArray[0] === thingArray[1] && thingArray[1] === thingArray[2]));
  }

  static checkSet(cards) {
    if (cards.length !== 3) {
      return false;
    }

    if (!SetGame.areThreeThingsAllSameOrDifferent(cards.map(card => card.shape))) {
      return false;
    }

    if (!SetGame.areThreeThingsAllSameOrDifferent(cards.map(card => card.color))) {
      return false;
    }

    if (!SetGame.areThreeThingsAllSameOrDifferent(cards.map(card => card.count))) {
      return false;
    }

    if (!SetGame.areThreeThingsAllSameOrDifferent(cards.map(card => card.filling))) {
      return false;
    }

    return true;
  }

  static checkCardEquality(a, b) {
    return a.shape === b.shape && a.color === b.color &&
    a.count === b.count && a.filling === b.filling;
  }

  // cards is an array of 3 {index: <boardIndex>, card{shape, color, count, filling}}
  submitSet(cards) {
    if (cards.length !== 3) {
      return false;
    }

    const setCards = [];
    for (let i = 0; i < 3; i += 1) {
      console.log(`SET CARD: ${JSON.stringify(cards[i])}`);
      if (cards[i].index >= this.board.length) {
        console.log('check length mismatch');
        return false;
      }

      if (!SetGame.checkCardEquality(cards[i].card, this.board[cards[i].index])) {
        console.log('check unequal');
        return false;
      }
      setCards.push(this.board[cards[i].index]);
    }

    if (!SetGame.checkSet(setCards)) {
      console.log('check false');
      return false;
    }

    console.log('check true');
    // we have a set, remove the cards
    const killIndices = cards.map(card => card.index);
    this.board = this.board.filter((element, index) => killIndices.find(killIndex => index === killIndex) === undefined);

    // refill the board if possible
    while (this.board.length < 12 && this.deck.length > 0) {
      this.board.push(this.deck.splice(0, 1)[0]);
    }

    // new board, new boardId
    this.boardId += 1;

    // done, return true
    return true;
  }

  /**
   *
   * @param {*} boardId The expected board id of the submitted set
   * @returns {Object} Whether no set was present (noSetPresent) and
   * whether a new deck was required for refill (newDeck)
   *
   */
  submitNoSet(boardId) {
    let noSetPresent = true;
    let newDeck = false;

    if (this.boardId !== boardId) {
      return { noSetPresent, newDeck };
    }


    for (let i = 0; i < this.board.length; i += 1) {
      for (let j = i + 1; j < this.board.length; j += 1) {
        for (let k = j + 1; k < this.board.length; k += 1) {
          if (SetGame.checkSet([this.board[i], this.board[j], this.board[k]])) {
            console.log([this.board[i], this.board[j], this.board[k]]);
            noSetPresent = false;
          }
        }
      }
    }

    if (noSetPresent) {
      if (this.deck.length === 0) {
        // out of cards to refill...new deck time!
        this.deck = SetGame.generateDeck();
        this.board = this.deck.splice(0, 12);
        this.gameId += 1;
        this.boardId += 1;
        newDeck = true;
      } else {
        const currentBoardLen = this.board.length;
        while (this.board.length < currentBoardLen + 3 && this.deck.length > 0) {
          this.board.push(this.deck.splice(0, 1)[0]);
        }
        this.boardId += 1;
      }
    }

    return { noSetPresent, newDeck };
  }

  getBoard() {
    return {
      gameId: this.gameId,
      boardId: this.boardId,
      board: this.board,
      numDeckCards: this.deck.length,
    };
  }
};
