export default class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  isEqual(position) {
    return this.x === position.x && this.y === position.y;
  }

  getMoved(ox, oy) {
    return new Position(this.x + ox, this.y + oy);
  }

  static clone(position) {
    return new Position(position.x, position.y);
  }
}
