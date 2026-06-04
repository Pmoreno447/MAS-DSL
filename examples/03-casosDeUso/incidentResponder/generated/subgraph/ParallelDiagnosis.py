from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeLogAnalyst, nodeMetricsAnalyst, nodeDeployAnalyst

def build_ParallelDiagnosis():
    builder = StateGraph(State)

    builder.add_node("loganalyst", nodeLogAnalyst)
    builder.add_node("metricsanalyst", nodeMetricsAnalyst)
    builder.add_node("deployanalyst", nodeDeployAnalyst)

    builder.add_edge(START, "loganalyst")

    return builder.compile()
