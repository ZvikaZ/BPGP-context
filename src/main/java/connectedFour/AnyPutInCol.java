//TODO: remove after fixing BPjs bug
package connectedFour;

import il.ac.bgu.cs.bp.bpjs.model.BEvent;
import il.ac.bgu.cs.bp.bpjs.model.eventsets.EventSet;

import java.util.Map;

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
        return super.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if(! (obj instanceof AnyPutInCol)) return false;
        AnyPutInCol o = (AnyPutInCol) obj;
        return o.col == col;
    }
}
