/**
 * @see contracts/Power.sol
 */
class Uint256Power {
  private readonly ONE = 1n;
  private readonly MIN_PRECISION = 32n;
  private readonly MAX_PRECISION = 127n;

  private readonly FIXED_1 = 0x080000000000000000000000000000000n;
  private readonly FIXED_2 = 0x100000000000000000000000000000000n;
  private readonly MAX_NUM = 0x200000000000000000000000000000000n;

  private readonly LN2_NUMERATOR = 0x3f80fe03f80fe03f80fe03f80fe03f8n;
  private readonly LN2_DENOMINATOR = 0x5b9de1d10bf4103d647b0955897ba80n;
  private readonly OPT_LOG_MAX_VAL = 0x15bf0a8b1457695355fb8ac404e7a79e3n;
  private readonly OPT_EXP_MAX_VAL = 0x800000000000000000000000000000000n;

  private readonly maxExpArray = new Array<bigint>(128);

  constructor() {
    this.maxExpArray[0] = 0x6bffffffffffffffffffffffffffffffffn;
    this.maxExpArray[1] = 0x67ffffffffffffffffffffffffffffffffn;
    this.maxExpArray[2] = 0x637fffffffffffffffffffffffffffffffn;
    this.maxExpArray[3] = 0x5f6fffffffffffffffffffffffffffffffn;
    this.maxExpArray[4] = 0x5b77ffffffffffffffffffffffffffffffn;
    this.maxExpArray[5] = 0x57b3ffffffffffffffffffffffffffffffn;
    this.maxExpArray[6] = 0x5419ffffffffffffffffffffffffffffffn;
    this.maxExpArray[7] = 0x50a2ffffffffffffffffffffffffffffffn;
    this.maxExpArray[8] = 0x4d517fffffffffffffffffffffffffffffn;
    this.maxExpArray[9] = 0x4a233fffffffffffffffffffffffffffffn;
    this.maxExpArray[10] = 0x47165fffffffffffffffffffffffffffffn;
    this.maxExpArray[11] = 0x4429afffffffffffffffffffffffffffffn;
    this.maxExpArray[12] = 0x415bc7ffffffffffffffffffffffffffffn;
    this.maxExpArray[13] = 0x3eab73ffffffffffffffffffffffffffffn;
    this.maxExpArray[14] = 0x3c1771ffffffffffffffffffffffffffffn;
    this.maxExpArray[15] = 0x399e96ffffffffffffffffffffffffffffn;
    this.maxExpArray[16] = 0x373fc47fffffffffffffffffffffffffffn;
    this.maxExpArray[17] = 0x34f9e8ffffffffffffffffffffffffffffn;
    this.maxExpArray[18] = 0x32cbfd5fffffffffffffffffffffffffffn;
    this.maxExpArray[19] = 0x30b5057fffffffffffffffffffffffffffn;
    this.maxExpArray[20] = 0x2eb40f9fffffffffffffffffffffffffffn;
    this.maxExpArray[21] = 0x2cc8340fffffffffffffffffffffffffffn;
    this.maxExpArray[22] = 0x2af09481ffffffffffffffffffffffffffn;
    this.maxExpArray[23] = 0x292c5bddffffffffffffffffffffffffffn;
    this.maxExpArray[24] = 0x277abdcdffffffffffffffffffffffffffn;
    this.maxExpArray[25] = 0x25daf6657fffffffffffffffffffffffffn;
    this.maxExpArray[26] = 0x244c49c65fffffffffffffffffffffffffn;
    this.maxExpArray[27] = 0x22ce03cd5fffffffffffffffffffffffffn;
    this.maxExpArray[28] = 0x215f77c047ffffffffffffffffffffffffn;
    this.maxExpArray[29] = 0x1fffffffffffffffffffffffffffffffffn;
    this.maxExpArray[30] = 0x1eaefdbdabffffffffffffffffffffffffn;
    this.maxExpArray[31] = 0x1d6bd8b2ebffffffffffffffffffffffffn;
    this.maxExpArray[32] = 0x1c35fedd14ffffffffffffffffffffffffn;
    this.maxExpArray[33] = 0x1b0ce43b323fffffffffffffffffffffffn;
    this.maxExpArray[34] = 0x19f0028ec1ffffffffffffffffffffffffn;
    this.maxExpArray[35] = 0x18ded91f0e7fffffffffffffffffffffffn;
    this.maxExpArray[36] = 0x17d8ec7f0417ffffffffffffffffffffffn;
    this.maxExpArray[37] = 0x16ddc6556cdbffffffffffffffffffffffn;
    this.maxExpArray[38] = 0x15ecf52776a1ffffffffffffffffffffffn;
    this.maxExpArray[39] = 0x15060c256cb2ffffffffffffffffffffffn;
    this.maxExpArray[40] = 0x1428a2f98d72ffffffffffffffffffffffn;
    this.maxExpArray[41] = 0x13545598e5c23fffffffffffffffffffffn;
    this.maxExpArray[42] = 0x1288c4161ce1dfffffffffffffffffffffn;
    this.maxExpArray[43] = 0x11c592761c666fffffffffffffffffffffn;
    this.maxExpArray[44] = 0x110a688680a757ffffffffffffffffffffn;
    this.maxExpArray[45] = 0x1056f1b5bedf77ffffffffffffffffffffn;
    this.maxExpArray[46] = 0x0faadceceeff8bffffffffffffffffffffn;
    this.maxExpArray[47] = 0x0f05dc6b27edadffffffffffffffffffffn;
    this.maxExpArray[48] = 0x0e67a5a25da4107fffffffffffffffffffn;
    this.maxExpArray[49] = 0x0dcff115b14eedffffffffffffffffffffn;
    this.maxExpArray[50] = 0x0d3e7a392431239fffffffffffffffffffn;
    this.maxExpArray[51] = 0x0cb2ff529eb71e4fffffffffffffffffffn;
    this.maxExpArray[52] = 0x0c2d415c3db974afffffffffffffffffffn;
    this.maxExpArray[53] = 0x0bad03e7d883f69bffffffffffffffffffn;
    this.maxExpArray[54] = 0x0b320d03b2c343d5ffffffffffffffffffn;
    this.maxExpArray[55] = 0x0abc25204e02828dffffffffffffffffffn;
    this.maxExpArray[56] = 0x0a4b16f74ee4bb207fffffffffffffffffn;
    this.maxExpArray[57] = 0x09deaf736ac1f569ffffffffffffffffffn;
    this.maxExpArray[58] = 0x0976bd9952c7aa957fffffffffffffffffn;
    this.maxExpArray[59] = 0x09131271922eaa606fffffffffffffffffn;
    this.maxExpArray[60] = 0x08b380f3558668c46fffffffffffffffffn;
    this.maxExpArray[61] = 0x0857ddf0117efa215bffffffffffffffffn;
    this.maxExpArray[62] = 0x07ffffffffffffffffffffffffffffffffn;
    this.maxExpArray[63] = 0x07abbf6f6abb9d087fffffffffffffffffn;
    this.maxExpArray[64] = 0x075af62cbac95f7dfa7fffffffffffffffn;
    this.maxExpArray[65] = 0x070d7fb7452e187ac13fffffffffffffffn;
    this.maxExpArray[66] = 0x06c3390ecc8af379295fffffffffffffffn;
    this.maxExpArray[67] = 0x067c00a3b07ffc01fd6fffffffffffffffn;
    this.maxExpArray[68] = 0x0637b647c39cbb9d3d27ffffffffffffffn;
    this.maxExpArray[69] = 0x05f63b1fc104dbd39587ffffffffffffffn;
    this.maxExpArray[70] = 0x05b771955b36e12f7235ffffffffffffffn;
    this.maxExpArray[71] = 0x057b3d49dda84556d6f6ffffffffffffffn;
    this.maxExpArray[72] = 0x054183095b2c8ececf30ffffffffffffffn;
    this.maxExpArray[73] = 0x050a28be635ca2b888f77fffffffffffffn;
    this.maxExpArray[74] = 0x04d5156639708c9db33c3fffffffffffffn;
    this.maxExpArray[75] = 0x04a23105873875bd52dfdfffffffffffffn;
    this.maxExpArray[76] = 0x0471649d87199aa990756fffffffffffffn;
    this.maxExpArray[77] = 0x04429a21a029d4c1457cfbffffffffffffn;
    this.maxExpArray[78] = 0x0415bc6d6fb7dd71af2cb3ffffffffffffn;
    this.maxExpArray[79] = 0x03eab73b3bbfe282243ce1ffffffffffffn;
    this.maxExpArray[80] = 0x03c1771ac9fb6b4c18e229ffffffffffffn;
    this.maxExpArray[81] = 0x0399e96897690418f785257fffffffffffn;
    this.maxExpArray[82] = 0x0373fc456c53bb779bf0ea9fffffffffffn;
    this.maxExpArray[83] = 0x034f9e8e490c48e67e6ab8bfffffffffffn;
    this.maxExpArray[84] = 0x032cbfd4a7adc790560b3337ffffffffffn;
    this.maxExpArray[85] = 0x030b50570f6e5d2acca94613ffffffffffn;
    this.maxExpArray[86] = 0x02eb40f9f620fda6b56c2861ffffffffffn;
    this.maxExpArray[87] = 0x02cc8340ecb0d0f520a6af58ffffffffffn;
    this.maxExpArray[88] = 0x02af09481380a0a35cf1ba02ffffffffffn;
    this.maxExpArray[89] = 0x0292c5bdd3b92ec810287b1b3fffffffffn;
    this.maxExpArray[90] = 0x0277abdcdab07d5a77ac6d6b9fffffffffn;
    this.maxExpArray[91] = 0x025daf6654b1eaa55fd64df5efffffffffn;
    this.maxExpArray[92] = 0x0244c49c648baa98192dce88b7ffffffffn;
    this.maxExpArray[93] = 0x022ce03cd5619a311b2471268bffffffffn;
    this.maxExpArray[94] = 0x0215f77c045fbe885654a44a0fffffffffn;
    this.maxExpArray[95] = 0x01ffffffffffffffffffffffffffffffffn;
    this.maxExpArray[96] = 0x01eaefdbdaaee7421fc4d3ede5ffffffffn;
    this.maxExpArray[97] = 0x01d6bd8b2eb257df7e8ca57b09bfffffffn;
    this.maxExpArray[98] = 0x01c35fedd14b861eb0443f7f133fffffffn;
    this.maxExpArray[99] = 0x01b0ce43b322bcde4a56e8ada5afffffffn;
    this.maxExpArray[100] = 0x019f0028ec1fff007f5a195a39dfffffffn;
    this.maxExpArray[101] = 0x018ded91f0e72ee74f49b15ba527ffffffn;
    this.maxExpArray[102] = 0x017d8ec7f04136f4e5615fd41a63ffffffn;
    this.maxExpArray[103] = 0x016ddc6556cdb84bdc8d12d22e6fffffffn;
    this.maxExpArray[104] = 0x015ecf52776a1155b5bd8395814f7fffffn;
    this.maxExpArray[105] = 0x015060c256cb23b3b3cc3754cf40ffffffn;
    this.maxExpArray[106] = 0x01428a2f98d728ae223ddab715be3fffffn;
    this.maxExpArray[107] = 0x013545598e5c23276ccf0ede68034fffffn;
    this.maxExpArray[108] = 0x01288c4161ce1d6f54b7f61081194fffffn;
    this.maxExpArray[109] = 0x011c592761c666aa641d5a01a40f17ffffn;
    this.maxExpArray[110] = 0x0110a688680a7530515f3e6e6cfdcdffffn;
    this.maxExpArray[111] = 0x01056f1b5bedf75c6bcb2ce8aed428ffffn;
    this.maxExpArray[112] = 0x00faadceceeff8a0890f3875f008277fffn;
    this.maxExpArray[113] = 0x00f05dc6b27edad306388a600f6ba0bfffn;
    this.maxExpArray[114] = 0x00e67a5a25da41063de1495d5b18cdbfffn;
    this.maxExpArray[115] = 0x00dcff115b14eedde6fc3aa5353f2e4fffn;
    this.maxExpArray[116] = 0x00d3e7a3924312399f9aae2e0f868f8fffn;
    this.maxExpArray[117] = 0x00cb2ff529eb71e41582cccd5a1ee26fffn;
    this.maxExpArray[118] = 0x00c2d415c3db974ab32a51840c0b67edffn;
    this.maxExpArray[119] = 0x00bad03e7d883f69ad5b0a186184e06bffn;
    this.maxExpArray[120] = 0x00b320d03b2c343d4829abd6075f0cc5ffn;
    this.maxExpArray[121] = 0x00abc25204e02828d73c6e80bcdb1a95bfn;
    this.maxExpArray[122] = 0x00a4b16f74ee4bb2040a1ec6c15fbbf2dfn;
    this.maxExpArray[123] = 0x009deaf736ac1f569deb1b5ae3f36c130fn;
    this.maxExpArray[124] = 0x00976bd9952c7aa957f5937d790ef65037n;
    this.maxExpArray[125] = 0x009131271922eaa6064b73a22d0bd4f2bfn;
    this.maxExpArray[126] = 0x008b380f3558668c46c91c49a2f8e967b9n;
    this.maxExpArray[127] = 0x00857ddf0117efa215952912839f6473e6n;
  }

  public power(
    _baseN: bigint,
    _baseD: bigint,
    _expN: bigint,
    _expD: bigint,
  ): {
    result: bigint;
    precision: bigint;
  } {
    if (_baseN >= this.MAX_NUM) throw new Error('Invalid _baseN');

    let baseLog: bigint;
    const base = (_baseN * this.FIXED_1) / _baseD;
    if (base < this.OPT_LOG_MAX_VAL) {
      baseLog = this.optimalLog(base);
    } else {
      baseLog = this.generalLog(base);
    }

    const baseLogTimesExp = (baseLog * _expN) / _expD;
    if (baseLogTimesExp < this.OPT_EXP_MAX_VAL) {
      return {
        result: this.optimalExp(baseLogTimesExp),
        precision: this.MAX_PRECISION,
      };
    } else {
      const precision = this.findPositionInMaxExpArray(baseLogTimesExp);
      return {
        result: this.generalExp(
          baseLogTimesExp >> (this.MAX_PRECISION - precision),
          precision,
        ),
        precision,
      };
    }
  }

  private generalLog(x: bigint): bigint {
    let res = 0n;

    if (x >= this.FIXED_2) {
      const count = this.floorLog2(x / this.FIXED_1);
      x >>= count;
      res = count * this.FIXED_1;
    }

    if (x > this.FIXED_1) {
      for (let i = this.MAX_PRECISION; i > 0n; --i) {
        x = (x * x) / this.FIXED_1;
        if (x >= this.FIXED_2) {
          x >>= 1n;
          res += this.ONE << (i - 1n);
        }
      }
    }

    return (res * this.LN2_NUMERATOR) / this.LN2_DENOMINATOR;
  }

  private floorLog2(_n: bigint): bigint {
    let res = 0n;

    if (_n < 256n) {
      while (_n > 1n) {
        _n >>= 1n;
        res += 1n;
      }
    } else {
      for (let s = 128n; s > 0n; s >>= 1n) {
        if (_n >= this.ONE << s) {
          _n >>= s;
          res |= s;
        }
      }
    }

    return res;
  }

  private findPositionInMaxExpArray(_x: bigint): bigint {
    let lo = this.MIN_PRECISION;
    let hi = this.MAX_PRECISION;

    while (lo + 1n < hi) {
      let mid = (lo + hi) / 2n;
      if (this.maxExpArray[Number(mid)] >= _x) lo = mid;
      else hi = mid;
    }
    if (this.maxExpArray[Number(hi)] >= _x) return hi;
    if (this.maxExpArray[Number(lo)] >= _x) return lo;

    throw new Error('No data returned');
  }

  private generalExp(_x: bigint, _precision: bigint): bigint {
    let xi = _x;
    let res = 0n;

    xi = (xi * _x) >> _precision;
    res += xi * 0x3442c4e6074a82f1797f72ac0000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x116b96f757c380fb287fd0e40000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x045ae5bdd5f0e03eca1ff4390000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00defabf91302cd95b9ffda50000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x002529ca9832b22439efff9b8000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00054f1cf12bd04e516b6da88000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000a9e39e257a09ca2d6db51000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000012e066e7b839fa050c309000000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000001e33d7d926c329a1ad1a800000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000002bee513bdb4a6b19b5f800000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000003a9316fa79b88eccf2a00000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000048177ebe1fa812375200000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000005263fe90242dcbacf00000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000000000057e22099c030d94100000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000057e22099c030d9410000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000052b6b54569976310000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000004985f67696bf748000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000000000000003dea12ea99e498000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000000031880f2214b6e000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000000000000000025bcff56eb36000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000000000000000001b722e10ab1000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000001317c70077000n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000000000000cba84aafa00n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000000000000082573a0a00n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000000000000005035ad900n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x000000000000000000000002f881b00n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000000000001b29340n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x00000000000000000000000000efc40n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000000000000007fe0n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000000000000000420n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000000000000000021n;
    xi = (xi * _x) >> _precision;
    res += xi * 0x0000000000000000000000000000001n;

    return (
      res / 0x688589cc0e9505e2f2fee5580000000n + _x + (this.ONE << _precision)
    );
  }

  private optimalLog(x: bigint): bigint {
    let res = 0n;

    let y: bigint;
    let z: bigint;
    let w: bigint;

    if (x >= 0xd3094c70f034de4b96ff7d5b6f99fcd8n) {
      res += 0x40000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0xd3094c70f034de4b96ff7d5b6f99fcd8n;
    }
    if (x >= 0xa45af1e1f40c333b3de1db4dd55f29a7n) {
      res += 0x20000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0xa45af1e1f40c333b3de1db4dd55f29a7n;
    }
    if (x >= 0x910b022db7ae67ce76b441c27035c6a1n) {
      res += 0x10000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x910b022db7ae67ce76b441c27035c6a1n;
    }
    if (x >= 0x88415abbe9a76bead8d00cf112e4d4a8n) {
      res += 0x08000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x88415abbe9a76bead8d00cf112e4d4a8n;
    }
    if (x >= 0x84102b00893f64c705e841d5d4064bd3n) {
      res += 0x04000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x84102b00893f64c705e841d5d4064bd3n;
    }
    if (x >= 0x8204055aaef1c8bd5c3259f4822735a2n) {
      res += 0x02000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x8204055aaef1c8bd5c3259f4822735a2n;
    }
    if (x >= 0x810100ab00222d861931c15e39b44e99n) {
      res += 0x01000000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x810100ab00222d861931c15e39b44e99n;
    }
    if (x >= 0x808040155aabbbe9451521693554f733n) {
      res += 0x00800000000000000000000000000000n;
      x = (x * this.FIXED_1) / 0x808040155aabbbe9451521693554f733n;
    }

    z = y = x - this.FIXED_1;
    w = (y * y) / this.FIXED_1;
    res +=
      (z * (0x100000000000000000000000000000000n - y)) /
      0x100000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x0aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan - y)) /
      0x200000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x099999999999999999999999999999999n - y)) /
      0x300000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x092492492492492492492492492492492n - y)) /
      0x400000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x08e38e38e38e38e38e38e38e38e38e38en - y)) /
      0x500000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x08ba2e8ba2e8ba2e8ba2e8ba2e8ba2e8bn - y)) /
      0x600000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x089d89d89d89d89d89d89d89d89d89d89n - y)) /
      0x700000000000000000000000000000000n;
    z = (z * w) / this.FIXED_1;
    res +=
      (z * (0x088888888888888888888888888888888n - y)) /
      0x800000000000000000000000000000000n;

    return res;
  }

  private optimalExp(x: bigint): bigint {
    let res = 0n;

    let y: bigint;
    let z: bigint;

    z = y = x % 0x10000000000000000000000000000000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x10e1b3be415a0000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x05a0913f6b1e0000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0168244fdac78000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x004807432bc18000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x000c0135dca04000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0001b707b1cdc000n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x000036e0f639b800n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x00000618fee9f800n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000009c197dcc00n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000e30dce400n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x000000012ebd1300n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000017499f00n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000001a9d480n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x00000000001c6380n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x000000000001c638n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000000001ab8n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x000000000000017cn;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000000000014n;
    z = (z * y) / this.FIXED_1;
    res += z * 0x0000000000000001n;
    res = res / 0x21c3677c82b40000n + y + this.FIXED_1;

    if ((x & 0x010000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x1c3d6a24ed82218787d624d3e5eba95f9n) /
        0x18ebef9eac820ae8682b9793ac6d1e776n;
    if ((x & 0x020000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x18ebef9eac820ae8682b9793ac6d1e778n) /
        0x1368b2fc6f9609fe7aceb46aa619baed4n;
    if ((x & 0x040000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x1368b2fc6f9609fe7aceb46aa619baed5n) /
        0x0bc5ab1b16779be3575bd8f0520a9f21fn;
    if ((x & 0x080000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x0bc5ab1b16779be3575bd8f0520a9f21en) /
        0x0454aaa8efe072e7f6ddbab84b40a55c9n;
    if ((x & 0x100000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x0454aaa8efe072e7f6ddbab84b40a55c5n) /
        0x00960aadc109e7a3bf4578099615711ean;
    if ((x & 0x200000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x00960aadc109e7a3bf4578099615711d7n) /
        0x0002bf84208204f5977f9a8cf01fdce3dn;
    if ((x & 0x400000000000000000000000000000000n) !== 0n)
      res =
        (res * 0x0002bf84208204f5977f9a8cf01fdc307n) /
        0x0000003c6ab775dd0b95b4cbee7e65d11n;

    return res;
  }
}

const power = new Uint256Power();

export default power;
