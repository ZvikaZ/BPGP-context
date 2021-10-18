package connectedFour;

import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.BProgramRunnerListenerAdapter;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.PrintBProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.model.BEvent;
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


    public static void singleRun(int boardNum) {
        BProgram bprog = new ContextBProgram("wumpus/boards/board" + boardNum + ".js", "wumpus/dal.js", "wumpus/bl.js", "wumpus/evolved.js");
//        BProgram bprog = new ContextBProgram("wumpus/20x20/board" + boardNum + ".js", "wumpus/dal.js", "wumpus/bl.js", "wumpus/evolved.js");
        final BProgramRunner rnr = new BProgramRunner(bprog);
        rnr.addListener(new PrintBProgramRunnerListener());
//        rnr.addListener(new PrintCOBProgramRunnerListener(logLevel, new BProgramRunnerListenerAdapter() {
//            private int counter = 0;
//            private long startTime;
//            @Override
//            public void eventSelected(BProgram bp, BEvent theEvent) {
//                super.eventSelected(bp, theEvent);
//                System.out.println(theEvent);
//                counter++;
//            }
//
//            @Override
//            public void started(BProgram bp) {
//                super.started(bp);
//                startTime = System.currentTimeMillis();
//            }
//
//            @Override
//            public void ended(BProgram bp) {
//                long delta = System.currentTimeMillis() - startTime;
//                System.out.println("number of events: "+counter);
//                System.out.println("seconds: "+ (delta / 1000));
//                System.out.println("avg mili for event: " + (delta / counter));
//            }
//        }));

        System.out.println("Using seed: " + seed);
        var prio = new PrioritizedBSyncEventSelectionStrategy(seed);
        prio.setDefaultPriority(0);
        bprog.setEventSelectionStrategy(prio);
//      bprog.setWaitForExternalEvents(true);
        rnr.run();
    }

    public static void main(final String[] args) {
        // with old manual strategies:
        // 1: climbed, score: 796
        // 2: climbed, score: 576
        // 3: climbed, score: 960
        // 4: wandering, score: -1442   [should be solved by braveness!]
        // 5: wandering, score: -1442   [should be solved by braveness!]
        for (int i = 1; i <= 5; i++) {
            System.out.println("****************************************************");
            System.out.println("****************************************************");
            System.out.println("****************************************************");
            System.out.println("** BOARD " + i);
            singleRun(i);
        }
    }

}