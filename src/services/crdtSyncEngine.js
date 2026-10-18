/**
 * CRDT LWW-Element-Set (Last-Write-Wins Element Set) Engine
 * Algoritmo determinista para resolución de conflictos en sincronización local distribuida
 * de transacciones y registros financieros sin requerir un servidor central.
 */

export class LWWElementSet {
  constructor(initialState = { addSet: {}, removeSet: {} }) {
    this.addSet = { ...initialState.addSet };
    this.removeSet = { ...initialState.removeSet };
  }

  /**
   * Añade o actualiza un elemento con una marca de tiempo determinista
   * @param {string} id - Identificador único del registro
   * @param {any} value - Carga útil del registro
   * @param {number} [timestamp=Date.now()] - Marca de tiempo en ms
   */
  add(id, value, timestamp = Date.now()) {
    const existing = this.addSet[id];
    if (!existing || timestamp >= existing.timestamp) {
      this.addSet[id] = { value, timestamp };
    }
  }

  /**
   * Marca un elemento como eliminado mediante tombstone con timestamp
   * @param {string} id - Identificador único
   * @param {number} [timestamp=Date.now()] - Marca de tiempo en ms
   */
  remove(id, timestamp = Date.now()) {
    const existing = this.removeSet[id];
    if (!existing || timestamp >= existing.timestamp) {
      this.removeSet[id] = { timestamp };
    }
  }

  /**
   * Determina si un elemento existe considerando la regla Last-Write-Wins
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    const added = this.addSet[id];
    if (!added) return false;

    const removed = this.removeSet[id];
    if (!removed) return true;

    // Regla LWW: gana el timestamp más reciente. Si empatan, la adición prevalece (bias to add).
    return added.timestamp >= removed.timestamp;
  }

  /**
   * Obtiene todos los elementos activos resueltos
   * @returns {Array<any>}
   */
  getResolvedElements() {
    const results = [];
    for (const [id, item] of Object.entries(this.addSet)) {
      if (this.has(id)) {
        results.push({ id, ...item.value, _crdtTimestamp: item.timestamp });
      }
    }
    return results;
  }

  /**
   * Fusiona de manera conmutativa, asociativa e idempotente otro estado CRDT
   * @param {{ addSet: Record<string, any>, removeSet: Record<string, any> }} remoteState
   */
  merge(remoteState) {
    if (!remoteState) return;

    // Fusionar addSet con max timestamp
    if (remoteState.addSet) {
      for (const [id, item] of Object.entries(remoteState.addSet)) {
        this.add(id, item.value, item.timestamp);
      }
    }

    // Fusionar removeSet con max timestamp
    if (remoteState.removeSet) {
      for (const [id, item] of Object.entries(remoteState.removeSet)) {
        this.remove(id, item.timestamp);
      }
    }
  }

  /**
   * Serializa el estado interno para persistencia o transporte P2P
   */
  toJSON() {
    return {
      addSet: this.addSet,
      removeSet: this.removeSet,
    };
  }
}

export default LWWElementSet;
