<template>
    <!-- 标题 -->
    <div class="fixed top-16 left-1/2 transform -translate-x-1/2 z-20 text-center animate-float w-auto min-w-max">
        <div class="relative px-4">


            <!-- 艺术字logo -->
            <h1 class="logo-art">Let’s <span class="logo-art-talk">Talk</span></h1>
        </div>
    </div>
</template>


<style scoped lang="less">
.logo-art {
    font-family: 'Segoe Script', 'Comic Sans MS', 'Brush Script MT', cursive, sans-serif;
    font-size: 1.6rem;
    letter-spacing: 0.12em;
    font-weight: bold;
    background: linear-gradient(90deg, #3b82f6 10%, #a21caf 50%, #ec4899 90%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 8px rgba(60, 60, 120, 0.18), 0 2px 12px #fff2, 0 0 0 #0000;
    padding: 0.2em 0.5em;
    border-radius: 1em;
    display: inline-block;
    margin: 0 auto;
    transition: none;
}

.logo-art-talk {
    font-family: 'Segoe UI', sans-serif;
    font-style: italic;
    font-size: 1.1em;
    letter-spacing: 0.18em;
    font-weight: lighter;
    color: #fff;
    background: linear-gradient(90deg, #f59e42 10%, #f43f5e 90%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 10px #f43f5e44, 0 2px 12px #fff2;
}
</style>
