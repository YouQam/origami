import { Injectable } from "@angular/core";

import { Game } from "./../models/game";

@Injectable({
  providedIn: "root"
})
export class GameFactoryService {
  public game: Game;

  constructor() {}

  addGameInformation(data: any) {
    this.game = {
      ...this.game,
      ...data
    };
    console.log("New Game: ", this.game);
  }

  addTask(task: any, index) {
    // console.log(task, index);
    if (this.game.hasOwnProperty("tasks")) {
      const newTaskArr = this.game.tasks;
      newTaskArr.splice(index, 0, task);
      console.log(newTaskArr);
      this.game = {
        ...this.game,
        tasks: newTaskArr
      };
    } else {
      this.game = {
        ...this.game,
        tasks: [task]
      };
    }
  }

  removeTask(taskID: number) {
    this.game.tasks = this.game.tasks.filter(t => t.id != taskID);
    return this.game;
  }

  getGame() {
    if (!this.game) {
      this.game = new Game(
        Math.floor(Date.now() / 1000),
        "test-name",
        "test-autor",
        "test-description",
        true,
        [],
        0
      );
    }
    return this.game;
  }
}
