//TODO: remove after fixing BPjs bug
package connectedFour;

import il.ac.bgu.cs.bp.bpjs.model.BEvent;
import il.ac.bgu.cs.bp.bpjs.model.eventsets.EventSet;

import java.util.Map;
import java.util.Objects;

public class AnyPutInCol implements EventSet {
    private final int col;

    public AnyPutInCol(int col) {
        this.col = col;
    }

    @Override
    public boolean contains(BEvent bEvent) {
        return bEvent.name.equals("Put") && ((Double) ((Map<String, Object>) bEvent.maybeData).get("col")).intValue() == col;
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(col);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AnyPutInCol that = (AnyPutInCol) o;
        return col == that.col;
    }
}
