const SetGame = require('./setGame');

module.exports = class SetTracker {
  /**
   *
   * @param {Object} outbound Outbound comms, exposes sendAll(topic, data) and sendToId(topic, data)
   */
  constructor(outbound) {
    this.setGame = new SetGame();
    this.sessions = {};
    this.nextId = 1;

    this.outbound = outbound;
  }

  addNewSession() {
    const thisId = this.nextId.toString();
    this.nextId += 1;

    this.sessions[thisId] = {
      name: 'Anon',
      state: 'ACTIVE',
      decksWon: 0,
      setsFoundInCurrentDeck: 0,
      setsFound: 0, // total sets found
      connType: 'PLAYER',
    };
    return thisId;
  }

  removeSession(id) {
    delete this.sessions[id];
  }

  setName(id, name) {
    if (id in this.sessions) {
      this.sessions[id].name = name;
    }
  }

  setConnectionType(id, connectionType) {
    if (id in this.sessions) {
      this.sessions[id].connType = connectionType;
    }
  }

  submitSet(id, set) {
    if (id in this.sessions) {
      if (this.setGame.submitSet(set)) {
        this.sessions[id].setsFound = this.sessions[id].setsFound + 1;
        this.sessions[id].setsFoundInCurrentDeck = this.sessions[id].setsFoundInCurrentDeck + 1;
        this.broadcastMessage(`${this.sessions[id].name} found a set!`, { set });
        this.broadcastSetFound(id, set);
        this.broadcastBoard();
      } else {
        this.broadcastMessage(`${this.sessions[id].name} doesn't know what a set is!  LOL!!!`);
      }
    }
  }

  submitNoSet(id, boardId) {
    if (id in this.sessions) {
      const noSetResult = this.setGame.submitNoSet(boardId);
      if (noSetResult.noSetPresent) {
        this.broadcastMessage(`${this.sessions[id].name} found a lack of a set!`);
        console.log(JSON.stringify(noSetResult));
        if (noSetResult.newDeck) {
          console.log('NEW GAME!!!');
          this.handleDeckEndStats();
        }
        this.broadcastBoard();
      } else {
        this.broadcastMessage(`${this.sessions[id].name} wanted new cards when there is a set.  SAD!!!`);
      }
    }
  }

  handleDeckEndStats() {
    let winningIds = [];
    let winningScore = -1;
    let winnersString = '';
    Object.entries(this.sessions).forEach((session) => {
      if (session[1].setsFoundInCurrentDeck > winningScore) {
        winningScore = session[1].setsFoundInCurrentDeck;
        winningIds = [session[0]];
      } else if (session[0].setsFoundInCurrentDeck === winningScore) {
        winningIds = winningIds.push(session[0]);
      }
    });

    Object.entries(this.sessions).forEach((session) => {
      if (winningIds.includes(session[0])) {
        session[1].decksWon += 1;
        winnersString += winnersString === '' ? '' : ', ';
        winnersString += session[1].name;
      }
      session[1].setsFoundInCurrentDeck = 0;
    });

    this.broadcastDeckEnded(winningIds, winningScore);
    this.broadcastMessage(`${winnersString} won the deck with ${winningScore} sets!`);
  }

  requestBoard() {
    this.broadcastBoard();
  }

  requestPlayers() {
    this.broadcastPlayers();
  }

  broadcastBoard() {
    this.outbound.sendAll('BOARD', this.setGame.getBoard());
  }

  broadcastSetFound(id, set) {
    this.outbound.sendAll('SET_FOUND', {
      id,
      name: this.sessions[id].name,
      set,
    });
  }

  broadcastDeckEnded(winningIds, winningScore) {
    this.outbound.sendAll('DECK_FINISHED', {
      winningIds,
      winningScore,
    });
  }

  broadcastPlayers() {
    const outboundMessage = {};
    outboundMessage.playerList = Object.entries(this.sessions).map(entry =>
      Object.assign({}, { id: entry[0] }, entry[1]));
    this.outbound.sendAll('PLAYERS', outboundMessage);
  }

  broadcastMessage(message, extra = null) {
    this.outbound.sendAll('MESSAGE', { message, extra });
  }
};
