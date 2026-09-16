---
title: 环境准备与课前导读
task: task-1
date: 2026-09-15
difficulty: 2
status: completed
draft: false
summary: 完成工具链自检，并第一次把 Agent、RAG、MCP 等分散概念放进同一张基础地图。
---

## Takeaway

这次不是学会所有概念，而是先知道它们分别站在哪里。

真正有价值的进展，是开始能区分 LangChain 与 LangGraph、朴素 RAG 与 Agentic RAG，以及 MCP、function call 与 CLI 各自解决的问题。

## 学习过程中随笔

<div class="thought-list">
  <figure class="note-figure">
    <figcaption><span>01</span><p>常听说“超长上下文”，但直到这次才对上下文窗口相当于多少页文档有了具体感觉。</p></figcaption>
    <img src="../../assets/context-window.png" alt="上下文窗口与文档页数的课程示意图" loading="lazy">
  </figure>
  <figure class="note-figure">
    <figcaption><span>02</span><p>过去接触过很多 Agent 架构，反而目不暇接。先识别主流框架，让知识更容易被吸收。</p></figcaption>
    <img src="../../assets/agent-frameworks.png" alt="主流 Agent 框架课程图" loading="lazy">
  </figure>
  <figure class="note-figure">
    <figcaption><span>03</span><p>LangChain 和 LangGraph 的区别以前总说不直白，这张图第一次把关系讲清楚了。</p></figcaption>
    <img src="../../assets/langchain-langgraph.png" alt="LangChain 与 LangGraph 区别示意图" loading="lazy">
  </figure>
  <figure class="note-figure">
    <figcaption><span>04</span><p>朴素 RAG 与 Agentic RAG 的差异已经看见，但 Agentic RAG 的实现方式仍是后续重点。</p></figcaption>
    <img src="../../assets/rag-types.png" alt="朴素 RAG 与 Agentic RAG 对比图" loading="lazy">
  </figure>
  <div class="text-thought"><span>05</span><p>MCP、function call 和 CLI 仍然容易混淆，需要用真实例子反复区分，而不是只记定义。</p></div>
  <figure class="note-figure">
    <figcaption><span>06</span><p>能看懂一段描述，不代表知道如何实现。把“看懂但不会做”明确记为后续学习重点。</p></figcaption>
    <img src="../../assets/implementation-gap.png" alt="课程中的实现说明截图" loading="lazy">
  </figure>
  <figure class="note-figure">
    <figcaption><span>07</span><p>作为产品经理，我很好奇开发人员在同一套工具链中的执行方式和观察视角。</p></figcaption>
    <img src="../../assets/developer-view.png" alt="开发执行视角相关课程截图" loading="lazy">
  </figure>
</div>

## 下一步

- 用一个最小例子区分 MCP、function call 与 CLI。
- 实现一次基础 RAG，再观察 Agentic RAG 多出的决策环节。
- 从开发者视角记录执行顺序、调试点和失败反馈。
