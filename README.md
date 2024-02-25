<h1>Welcome to my Murano Glass Cup renderer </h1>

<h2> The project </h2>
As a final project for my Computer Graphics class at NYU, I decided to model a set of Murano glass cups I own. I created the cup mesh as well as my own texture.  <br>
<p align="center">
<img width="800" alt="Screenshot 2024-01-22 at 9 59 26 AM" src="https://github.com/mariabeatrizsilva/murano/assets/67334485/8ca7794e-abbe-493f-be27-12d9e5e26d58"> 
<br> 
 <a href="[https://cims.nyu.edu/~ms14127/GRAPHICS/murano/index.html](https://mariabeatrizsilva.github.io/murano/index.html)()"><img alt="muranoproj" src="https://img.shields.io/badge/click_here_to_see-the_project-blue?style=flat"></a>

<h2> Adding your own flare</h2>
The code for this project was written in HTML and JavaScript with WebGL. The texture on the cups is all done procedurally, which means you can make your own set of cups! The code to modify the cups is contained in <code>basecup.js</code>. To create your own texture, scroll down to the fragment shader and create your own function that will make the texture. For example, this is where the texture for the red cup is defined: <br> <img width="620" alt="Screenshot 2024-01-22 at 10 10 06 AM" src="https://github.com/mariabeatrizsilva/murano/assets/67334485/ab328cc0-9d8e-47ed-af69-cef0f2e6e063"> <br>
Then, in the <code>cup_text</code> function, return the texture you created. Currently, the code is set to support 8 different colors as specified by the <code>cupText</code> variable (see below), but rather than having if statements, you can simply return the texture you created. <br>
<img width="637" alt="Screenshot 2024-01-22 at 10 10 32 AM" src="https://github.com/mariabeatrizsilva/murano/assets/67334485/1c582f10-a6f6-41d5-85fe-698a2ca02e6c">

