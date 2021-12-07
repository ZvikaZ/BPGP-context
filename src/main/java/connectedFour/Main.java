package connectedFour;

import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.PrintBProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.bpjs.model.eventselection.PrioritizedBSyncEventSelectionStrategy;


public class Main {
    /**
     * Choose the desired COBP program...
     */

    /**
     * internal context events are: "CTX.Changed", "_____CTX_LOCK_____", "_____CTX_RELEASE_____"
     * You can filter these event from printing on console using the Level:
     * Level.ALL : print all
     * Level.NONE : print none
     * Level.CtxChanged: print only CTX.Changed events (i.e., filter the transaction lock/release events)
     */

    static long seed = System.currentTimeMillis();


    public static void singleRun() {
//        BProgram bprog = new ContextBProgram("wumpus/boards/board" + boardNum + ".js", "wumpus/dal.js", "wumpus/bl.js", "wumpus/evolved.js");
        BProgram bprog = new ContextBProgram("connect_four/dal.js", "connect_four/bl.js"); //, "connect_four/evolved.js");  //TODO evolved?
        final BProgramRunner rnr = new BProgramRunner(bprog);
        rnr.addListener(new PrintBProgramRunnerListener());

        System.out.println("Using seed: " + seed);
        var prio = new PrioritizedBSyncEventSelectionStrategy(seed);
        prio.setDefaultPriority(0);
        bprog.setEventSelectionStrategy(prio);
//      bprog.setWaitForExternalEvents(true);
        rnr.run();
    }

    public static void main(final String[] args) {
//        for (int i = 1; i <= 100; i++) {      //TODO
        for (int i = 1; i <= 4; i++) {
            System.out.println("****************************************************");
            System.out.println("****************************************************");
            System.out.println("****************************************************");
            System.out.println("** RUN " + i);
            singleRun();
        }
    }

}