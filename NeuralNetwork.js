class NeuralNetwork {
    constructor(neuronCounts) {
        this.layers = [];
        for(let i=0; i<neuronCounts.length-1; i++) {
            this.layers.push(new Layer(neuronCounts[i], neuronCounts[i+1]));
        }
    }

    static feedForward(inputs, network) {
        let outputs = Layer.feedForward(
            inputs, network.layers[0]
        );
        for(let i=1; i<network.layers.length; i++) {
            outputs = Layer.feedForward(outputs, network.layers[i]);
        }
        return outputs;
    }
}


class Layer {
    constructor(inputNo, outputNo) {
        this.inputs = new Array(inputNo);
        this.outputs = new Array(outputNo);
        this.biases = new Array(outputNo);

        this.weights = new Array(inputNo);
        for(let i=0; i<this.weights.length; i++) {
            this.weights[i] = new Array(outputNo);
        }

        Layer.#generateRandom(this);
    }

    static #generateRandom(layer) {
        for(let i=0; i<layer.weights.length; i++) {
            for(let j=0; j<layer.weights[i].length; j++) {
                layer.weights[i][j] = Math.random()*2 -1;
            }
        }

        for(let i=0; i<layer.biases.length; i++) {
            layer.biases[i] = Math.random()*2 -1;    
        }
    }
    static feedForward(inputs, layer) {
        // copy the inputs
        for(let i=0; i<inputs.length; i++) {
            layer.inputs[i] = inputs[i];
        }

        // calculate the outputs
        for(let i=0; i<layer.outputs.length; i++) {
            let score = 0;
            for(let j=0; j<layer.inputs.length; j++) {
                score += layer.inputs[j]*layer.weights[j][i] + layer.biases[i];
            }

            if(score>0)
                layer.outputs[i] = 1;
            else 
                layer.outputs[i] = 0;
        }
        return layer.outputs;
    }

    
}