st data = {
        surfaces: {},
        samplers: {}
      };
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "newparam":
            parseEffectNewparam(child, data);
            break;
          case "technique":
            data.technique = parseEffectTechnique(child);
            break;
          case "extra":
            data.extra = parseEffectExtra(child);
            break;
        }
      }
      return data;
    }
    function parseEffectNewparam(xml2, data) {
      const sid = xml2.getAttribute("sid");
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "surface":
            data.surfaces[sid] = parseEffectSurface(child);
            break;
          case "sampler2D":
            data.samplers[sid] = parseEffectSampler(child);
            break;
        }
      }
    }
    function parseEffectSurface(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "init_from":
            data.init_from = child.textContent;
            break;
        }
      }
      return data;
    }
    function parseEffectSampler(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "source":
            data.source = child.textContent;
            break;
        }
      }
      return data;
    }
    function parseEffectTechnique(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "constant":
          case "lambert":
          case "blinn":
          case "phong":
            data.type = child.nodeName;
            data.parameters = parseEffectParameters(child);
            break;
          case "extra":
            data.extra = parseEffectExtra(child);
            break;
        }
      }
      return data;
    }
    function parseEffectParameters(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "emission":
          case "diffuse":
          case "specular":
          case "bump":
          case "ambient":
          case "shininess":
          case "transparency":
            data[child.nodeName] = parseEffectParameter(child);
            break;
          case "transparent":
            data[child.nodeName] = {
              opaque: child.hasAttribute("opaque") ? child.getAttribute("opaque") : "A_ONE",
              data: parseEffectParameter(child)
            };
            break;
        }
      }
      return data;
    }
    function parseEffectParameter(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "color":
            data[child.nodeName] = parseFloats(child.textContent);
            break;
          case "float":
            data[child.nodeName] = parseFloat(child.textContent);
            break;
          case "texture":
            data[child.nodeName] = { id: child.getAttribute("texture"), extra: parseEffectParameterTexture(child) };
            break;
        }
      }
      return data;
    }
    function parseEffectParameterTexture(xml2) {
      const data = {
        technique: {}
      };
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "extra":
            parseEffectParameterTextureExtra(child, data);
            break;
        }
      }
      return data;
    }
    function parseEffectParameterTextureExtra(xml2, data) {
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "technique":
            parseEffectParameterTextureExtraTechnique(child, data);
            break;
        }
      }
    }
    function parseEffectParameterTextureExtraTechnique(xml2, data) {
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "repeatU":
          case "repeatV":
          case "offsetU":
          case "offsetV":
            data.technique[child.nodeName] = parseFloat(child.textContent);
            break;
          case "wrapU":
          case "wrapV":
            if (child.textContent.toUpperCase() === "TRUE") {
              data.technique[child.nodeName] = 1;
            } else if (child.textContent.toUpperCase() === "FALSE") {
              data.technique[child.nodeName] = 0;
            } else {
              data.technique[child.nodeName] = parseInt(child.textContent);
            }
            break;
          case "bump":
            data[child.nodeName] = parseEffectExtraTechniqueBump(child);
            break;
        }
      }
    }
    function parseEffectExtra(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "technique":
            data.technique = parseEffectExtraTechnique(child);
            break;
        }
      }
      return data;
    }
    function parseEffectExtraTechnique(xml2) {
      const data = {};
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "double_sided":
            data[child.nodeName] = parseInt(child.textContent);
            break;
          case "bump":
            data[child.nodeName] = parseEffectExtraTechniqueBump(child);
            break;
        }
      }
      return data;
    }
    function parseEffectExtraTechniqueBump(xml2) {
      var data = {};
      for (var i = 0, l = xml2.childNodes.length; i < l; i++) {
        var child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "texture":
            data[child.nodeName] = {
              id: child.getAttribute("texture"),
              texcoord: child.getAttribute("texcoord"),
              extra: parseEffectParameterTexture(child)
            };
            break;
        }
      }
      return data;
    }
    function buildEffect(data) {
      return data;
    }
    function getEffect(id) {
      return getBuild(library.effects[id], buildEffect);
    }
    function parseMaterial(xml2) {
      const data = {
        name: xml2.getAttribute("name")
      };
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "instance_effect":
            data.url = parseId(child.getAttribute("url"));
            break;
        }
      }
      library.materials[xml2.getAttribute("id")] = data;
    }
    function getTextureLoader(image) {
      let loader;
      let extension = image.slice((image.lastIndexOf(".") - 1 >>> 0) + 2);
      extension = extension.toLowerCase();
      switch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                