 (extension) {
        case "tga":
          loader = tgaLoader;
          break;
        default:
          loader = textureLoader;
      }
      return loader;
    }
    function buildMaterial(data) {
      const effect = getEffect(data.url);
      const technique = effect.profile.technique;
      let material;
      switch (technique.type) {
        case "phong":
        case "blinn":
          material = new THREE.MeshPhongMaterial();
          break;
        case "lambert":
          material = new THREE.MeshLambertMaterial();
          break;
        default:
          material = new THREE.MeshBasicMaterial();
          break;
      }
      material.name = data.name || "";
      function getTexture(textureObject) {
        const sampler = effect.profile.samplers[textureObject.id];
        let image = null;
        if (sampler !== void 0) {
          const surface = effect.profile.surfaces[sampler.source];
          image = getImage(surface.init_from);
        } else {
          console.warn("THREE.ColladaLoader: Undefined sampler. Access image directly (see #12530).");
          image = getImage(textureObject.id);
        }
        if (image !== null) {
          const loader = getTextureLoader(image);
          if (loader !== void 0) {
            const texture = loader.load(image);
            const extra = textureObject.extra;
            if (extra !== void 0 && extra.technique !== void 0 && isEmpty(extra.technique) === false) {
              const technique2 = extra.technique;
              texture.wrapS = technique2.wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
              texture.wrapT = technique2.wrapV ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
              texture.offset.set(technique2.offsetU || 0, technique2.offsetV || 0);
              texture.repeat.set(technique2.repeatU || 1, technique2.repeatV || 1);
            } else {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
            }
            return texture;
          } else {
            console.warn("THREE.ColladaLoader: Loader for texture %s not found.", image);
            return null;
          }
        } else {
          console.warn("THREE.ColladaLoader: Couldn't create texture with ID:", textureObject.id);
          return null;
        }
      }
      const parameters = technique.parameters;
      for (const key in parameters) {
        const parameter = parameters[key];
        switch (key) {
          case "diffuse":
            if (parameter.color)
              material.color.fromArray(parameter.color);
            if (parameter.texture)
              material.map = getTexture(parameter.texture);
            break;
          case "specular":
            if (parameter.color && material.specular)
              material.specular.fromArray(parameter.color);
            if (parameter.texture)
              material.specularMap = getTexture(parameter.texture);
            break;
          case "bump":
            if (parameter.texture)
              material.normalMap = getTexture(parameter.texture);
            break;
          case "ambient":
            if (parameter.texture)
              material.lightMap = getTexture(parameter.texture);
            break;
          case "shininess":
            if (parameter.float && material.shininess)
              material.shininess = parameter.float;
            break;
          case "emission":
            if (parameter.color && material.emissive)
              material.emissive.fromArray(parameter.color);
            if (parameter.texture)
              material.emissiveMap = getTexture(parameter.texture);
            break;
        }
      }
      let transparent = parameters["transparent"];
      let transparency = parameters["transparency"];
      if (transparency === void 0 && transparent) {
        transparency = {
          float: 1
        };
      }
      if (transparent === void 0 && transparency) {
        transparent = {
          opaque: "A_ONE",
          data: {
            color: [1, 1, 1, 1]
          }
        };
      }
      if (transparent && transparency) {
        if (transparent.data.texture) {
          material.transparent = true;
        } else {
          const color = transparent.data.color;
          switch (transparent.opaque) {
            case "A_ONE":
              material.opacity = color[3] * transparency.float;
              break;
            case "RGB_ZERO":
              material.opacity = 1 - color[0] * transparency.float;
              break;
            case "A_ZERO":
              material.opacity = 1 - color[3] * transparency.float;
              break;
            case "RGB_ONE":
              material.opacity = color[0] * transparency.float;
              break;
            default:
              console.warn('THREE.ColladaLoader: Invalid opaque type "%s" of transparent tag.', transparent.opaque);
          }
          if (material.opacity < 1)
            material.transparent = true;
        }
      }
      if (technique.extra !== void 0 && technique.extra.technique !== void 0) {
        const techniques = technique.extra.technique;
        for (const k in techniques) {
          const v = techniques[k];
          switch (k) {
            case "double_sided":
              material.side = v === 1 ? THREE.DoubleSide : THREE.FrontSide;
              break;
            case "bump":
              material.normalMap = getTexture(v.texture);
              material.normalScale = new THREE.Vector2(1, 1);
              break;
          }
        }
      }
      return material;
    }
    function getMaterial(id) {
      return getBuild(library.materials[id], buildMaterial);
    }
    function parseCamera(xml2) {
      const data = {
        name: xml2.getAttribute("name")
      };
      for (let i = 0, l = xml2.childNodes.length; i < l; i++) {
        const child = xml2.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        switch (child.nodeName) {
          case "optics":
            data.optics = parseCameraOptics(child);
            break;
        }
      }
      library.cameras[xml2.getAttribute("id")] = data;
    }
    function parseCameraOptics(xml2) {
      for (let i = 0; i < xml2.childNodes.length; i++) {
        const child = xml2.childNodes[i];
        switch (child.nodeName) {
          case "technique_common":
            return parseCameraTechnique(child);
        }
      }
      return {};
    }
    function parseCameraTechnique(xml2) {
      const data = {};
      for (let i = 0; i < xml2.childNodes.length; i++) {
        const child = xml2.childNodes[i];
        switch (child.nodeName) {
          case "perspective":
          case "orthographic":
            data.technique = child.nodeName;
            data.parameters = parseCameraParameters(child);
            break;
        }
      }
      return data;
    }
    function parseCameraParameters(xml2) {
      const data = {};
      for (let i = 0; i < xml2.childNodes.length; i++) {
        const child = xml2.childNodes[i];
        switch (child.nodeName) {
          case "xfov":
          case "yfov":
          case "xmag":
          case "ymag":
          case "znear":
          case "zfar":
          case "aspect_ratio":
            data[child.nodeName] = parseFloat(child.textContent);
            break;
        }
      }
      return data;
    }
    function buildCamera(data) {
      let camera;
      switch (data.optics.technique) {
        case "perspective":
          camera = new THREE.PerspectiveCamera(
            data.optics.parameters.yfov,
            data.optics.parameters.aspect_ratio,
            data.optics.parameters.znear,
            data.optics.parameters.zfar
          );
          break;
        case "orthographic":
          let ymag = data.optics.parameters.ymag;
          let xmag = data.optics.parameters.xmag;
          const aspectRatio = data.optics.parameters.aspect_ratio;
          xmag = xmag === void 0 ? ymag * aspectRatio : xmag;
          ymag = ymag === void 0 ? xmag / aspectRatio : ymag;
          xmag *= 0.5;
          ymag *= 0.5;
          camera = new THREE.Orthograp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                