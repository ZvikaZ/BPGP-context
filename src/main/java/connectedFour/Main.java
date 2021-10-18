package connectedFour;

import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.context.PrintCOBProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.PrintBProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.bpjs.model.eventselection.PrioritizedBSyncEventSelectionStrategy;

import java.net.URISyntaxException;

import static il.ac.bgu.cs.bp.bpjs.context.PrintCOBProgramRunnerListener.Level;

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
//    private static final Level logLevel = Level.CtxChanged;
//    private static final Level logLevel = Level.ALL;
    private static final Level logLevel = Level.NONE;

    static long seed = System.currentTimeMillis();


    public static void singleRun(int boardNum) {
        BProgram bprog = new ContextBProgram("wumpus/boards/board" + boardNum + ".js", "wumpus/dal.js", "wumpus/bl.js", "wumpus/evolved.js");
//        BProgram bprog = new ContextBProgram("wumpus/20x20/board" + boardNum + ".js", "wumpus/dal.js", "wumpus/bl.js", "wumpus/evolved.js");
        final BProgramRunner rnr = new BProgramRunner(bprog);
        rnr.addListener(new PrintCOBProgramRunnerListener(logLevel, new PrintBProgramRunnerListener()));

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